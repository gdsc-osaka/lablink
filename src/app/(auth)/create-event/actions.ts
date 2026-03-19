"use server";

import { requireAuth } from "@/lib/auth/server-auth";
import { userGroupAdminRepo } from "@/infra/group/user-group-admin-repository";
import { firestoreEventAdminRepository } from "@/infra/event/event-admin-repo";
import type { EventDraft, NewEvent } from "@/domain/event";
import { revalidatePath } from "next/cache";
import { parseDuration } from "@/lib/event-to-draft";
import { findUsersByIds } from "@/infra/user/user-admin-repo";
import { googleCalendarRepository } from "@/infra/calendar/google-calendar-repo";
import { googleTokenRepository } from "@/infra/token/google-token-repo";
import { geminiRepo } from "@/infra/ai/gemini-repo";
import { createCalculateFreeTimeService } from "@/service/calculate-free-time-service";
import { createScheduleSuggestionService } from "@/service/schedule-suggestion-service";
import type { EventMember } from "@/domain/schedule-calculator";

export async function getScheduleSuggestionsAction(
    groupId: string,
    draft: EventDraft,
): Promise<
    | {
          success: true;
          suggestions: { start: string; end: string; reason: string }[];
      }
    | { success: false; error: string }
> {
    try {
        const decodedClaims = await requireAuth();
        const userId = decodedClaims.uid;

        const membersWithRolesResult =
            await userGroupAdminRepo.findMembersWithRoles(groupId);
        if (membersWithRolesResult.isErr()) {
            return {
                success: false,
                error: "グループメンバーの取得に失敗しました",
            };
        }

        const memberIds = membersWithRolesResult.value.map((m) => m.userId);
        if (!memberIds.includes(userId)) {
            return {
                success: false,
                error: "このグループへのアクセス権限がありません",
            };
        }
        const userMapResult = await findUsersByIds(memberIds);
        if (userMapResult.isErr()) {
            return {
                success: false,
                error: "ユーザー情報の取得に失敗しました",
            };
        }

        const priorityEmailSet = new Set(
            draft.priorityParticipants
                ? draft.priorityParticipants
                      .split(",")
                      .map((e) => e.trim())
                      .filter(Boolean)
                : [],
        );

        const members: EventMember[] = Array.from(
            userMapResult.value.values(),
        ).map((user) => ({
            ...user,
            isRequired:
                priorityEmailSet.size > 0
                    ? priorityEmailSet.has(user.email)
                    : true,
        }));

        const durationMinutes = parseDuration(draft.duration);

        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const rangeEnd = new Date(now);
        rangeEnd.setDate(rangeEnd.getDate() + 14);
        rangeEnd.setHours(23, 59, 59, 999);

        const scheduleRange = { start: tomorrow, end: rangeEnd };

        const scoresResult = await createCalculateFreeTimeService(
            googleCalendarRepository,
            googleTokenRepository,
        ).calculateFreeTime(scheduleRange, durationMinutes, members);

        if (scoresResult.isErr()) {
            return {
                success: false,
                error:
                    "カレンダー情報の取得に失敗しました: " +
                    scoresResult.error.message,
            };
        }

        const requiredCount = members.filter((m) => m.isRequired).length;

        const suggestionsResult = await createScheduleSuggestionService(
            geminiRepo,
        ).suggestSchedule(draft.description, scoresResult.value, requiredCount);

        if (suggestionsResult.isErr()) {
            return {
                success: false,
                error:
                    "AI提案の生成に失敗しました: " +
                    suggestionsResult.error.message,
            };
        }

        return {
            success: true,
            suggestions: suggestionsResult.value.map((s) => ({
                start: s.timeRange.start.toISOString(),
                end: s.timeRange.end.toISOString(),
                reason: s.reason,
            })),
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Failed to get schedule suggestions:", message);
        return {
            success: false,
            error: "日程提案の取得中にエラーが発生しました",
        };
    }
}

export async function createEventAction(
    groupId: string,
    eventData: NewEvent,
): Promise<
    { success: true; eventId: string } | { success: false; error: string }
> {
    const decodedClaims = await requireAuth();
    const userId = decodedClaims.uid;

    try {
        const memberIdsResult =
            await userGroupAdminRepo.getUserIdsByGroupId(groupId);

        if (memberIdsResult.isErr()) {
            return {
                success: false,
                error: "グループ情報の取得に失敗しました",
            };
        }

        if (!memberIdsResult.value.includes(userId)) {
            return {
                success: false,
                error: "このグループへのアクセス権限がありません",
            };
        }

        const result = await firestoreEventAdminRepository.createNewEvent(
            groupId,
            eventData,
        );

        return result.match(
            (event) => {
                revalidatePath("/group");
                return { success: true, eventId: event.id };
            },
            (err) => ({ success: false, error: err.message }),
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Failed to create event:", message);
        return {
            success: false,
            error: "イベントの作成中にエラーが発生しました",
        };
    }
}
