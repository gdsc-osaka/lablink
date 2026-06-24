"use server";

import { requireAuth } from "@/lib/auth/server-auth";
import { userGroupAdminRepo } from "@/infra/group/user-group-admin-repository";
import { firestoreEventAdminRepository } from "@/infra/event/event-admin-repo";
import type { EventDraft, EventTimeOfDay, NewEvent } from "@/domain/event";
import { EVENT_TIME_OF_DAY_CONFIG } from "@/domain/event";
import { revalidatePath } from "next/cache";
import { parseDuration } from "@/lib/event-to-draft";
import { findUsersByIds } from "@/infra/user/user-admin-repo";
import {
    googleCalendarRepository,
    googleHolidayRepository,
} from "@/infra/calendar/google-calendar-repo";
import { googleTokenRepository } from "@/infra/token/google-token-repo";
import { geminiRepo } from "@/infra/ai/gemini-repo";
import { createCalculateFreeTimeService } from "@/service/calculate-free-time-service";
import { createSchedulePreferenceService } from "@/service/schedule-preference-service";
import { formatToJST } from "@/lib/date";
import { buildSuggestionSearchRange } from "@/domain/suggestion-search-range";
import {
    EventMember,
    findMatchingPreferredHourRange,
    SchedulePreference,
    selectPreferredAndFallbackScores,
    TimeRangeScore,
} from "@/domain/schedule-calculator";
import {
    ScheduleSuggestion,
    ScheduleSuggestionSection,
    ScheduleSuggestionSectionKind,
} from "@/domain/schedule-suggestion";

export async function getScheduleSuggestionsAction(
    groupId: string,
    draft: EventDraft,
): Promise<
    | {
          success: true;
          sections: ScheduleSuggestionSection[];
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

        const scheduleRangeResult = buildSuggestionSearchRange(draft);
        if (!scheduleRangeResult.success) {
            return {
                success: false,
                error: scheduleRangeResult.error,
            };
        }
        const scheduleRange = scheduleRangeResult.range;

        // UI の timeOfDayCandidate（morning/noon/evening/night）を
        // JST の時刻範囲に変換し、スロット生成時のフィルタとして渡す。
        // ランタイムでフォームデータに無効値が混入する可能性に備え、
        // EVENT_TIME_OF_DAY_CONFIG に存在するキーのみ使用する。
        const validCandidates = draft.timeOfDayCandidate.filter(
            (t): t is EventTimeOfDay => t in EVENT_TIME_OF_DAY_CONFIG,
        );
        const allowedHourRanges =
            validCandidates.length > 0
                ? validCandidates.map((t) => EVENT_TIME_OF_DAY_CONFIG[t].hours)
                : undefined;

        const holidaysResult =
            await googleHolidayRepository.fetchJapaneseHolidays(
                userId,
                scheduleRange.start,
                scheduleRange.end,
                googleTokenRepository,
            );
        const holidays = holidaysResult.isOk() ? holidaysResult.value : [];
        if (holidaysResult.isErr()) {
            console.warn(
                "Failed to fetch Japanese holidays:",
                holidaysResult.error.message,
            );
        }

        const preferenceResult = await createSchedulePreferenceService(
            geminiRepo,
        ).extractPreference(draft.description, validCandidates, holidays);

        const schedulePreference = preferenceResult.isOk()
            ? preferenceResult.value
            : undefined;
        if (preferenceResult.isErr()) {
            console.warn(
                "Failed to extract schedule preference:",
                preferenceResult.error.message,
            );
        }

        const scoresResult = await createCalculateFreeTimeService(
            googleCalendarRepository,
            googleTokenRepository,
        ).calculateFreeTime(
            scheduleRange,
            durationMinutes,
            members,
            // UI時間帯フィルタは候補分割時に適用するため、ここでは全スロットを生成する。
            undefined,
            schedulePreference,
        );

        if (scoresResult.isErr()) {
            return {
                success: false,
                error:
                    "カレンダー情報の取得に失敗しました: " +
                    scoresResult.error.message,
            };
        }

        const requiredCount = members.filter((m) => m.isRequired).length;
        const suggestionScores = selectPreferredAndFallbackScores(
            scoresResult.value,
            3,
            allowedHourRanges,
            requiredCount,
        );

        return {
            success: true,
            sections: createSuggestionSections(
                suggestionScores,
                requiredCount,
                schedulePreference,
            ),
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

const createSuggestionReason = (
    score: TimeRangeScore,
    requiredCount: number,
    schedulePreference: SchedulePreference | undefined,
    sectionKind: ScheduleSuggestionSectionKind,
): string => {
    const displayStart = formatToJST(score.timeRange.start, "M月d日 H:mm");
    const allRequiredMembersAvailable =
        requiredCount > 0 &&
        score.availableMemberIds.required.length >= requiredCount;
    const availabilityText =
        requiredCount === 0
            ? `${displayStart}開始で、参加可能性をもとに選んだ候補です。`
            : allRequiredMembersAvailable
              ? `必須メンバー全員が参加可能な${displayStart}開始の候補です。`
              : `${displayStart}開始で、必須メンバー${score.availableMemberIds.required.length}/${requiredCount}人が参加可能な候補です。`;
    const matchingHourRange = schedulePreference
        ? findMatchingPreferredHourRange(score.timeRange, schedulePreference)
        : undefined;
    const preferenceText = matchingHourRange
        ? `入力内容から抽出した希望も加味しています。${matchingHourRange.reason}`
        : sectionKind === "fallback"
          ? "希望時間帯からは外れますが、参加可能性を優先して提示しています。"
          : "希望時間帯の中から参加可能性をもとに選んでいます。";

    return `${availabilityText}${preferenceText}`;
};

const createSuggestionSections = (
    scores: {
        preferred: TimeRangeScore[];
        fallback: TimeRangeScore[];
    },
    requiredCount: number,
    schedulePreference: SchedulePreference | undefined,
): ScheduleSuggestionSection[] => {
    const sections: ScheduleSuggestionSection[] = [
        {
            kind: "preferred",
            title: "希望時間帯の候補",
            description: "入力内容と選択した時間帯に沿った候補です。",
            suggestions: scores.preferred.map((score) =>
                createSuggestion(
                    score,
                    requiredCount,
                    schedulePreference,
                    "preferred",
                ),
            ),
        },
    ];

    if (scores.fallback.length > 0) {
        sections.push({
            kind: "fallback",
            title: "参加可能性を優先した候補",
            description:
                "希望時間帯では必須メンバーの都合が合いにくいため、別時間帯の候補も表示しています。",
            suggestions: scores.fallback.map((score) =>
                createSuggestion(
                    score,
                    requiredCount,
                    schedulePreference,
                    "fallback",
                ),
            ),
        });
    }

    return sections;
};

const createSuggestion = (
    score: TimeRangeScore,
    requiredCount: number,
    schedulePreference: SchedulePreference | undefined,
    sectionKind: ScheduleSuggestionSectionKind,
): ScheduleSuggestion => ({
    start: score.timeRange.start.toISOString(),
    end: score.timeRange.end.toISOString(),
    reason: createSuggestionReason(
        score,
        requiredCount,
        schedulePreference,
        sectionKind,
    ),
});

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
