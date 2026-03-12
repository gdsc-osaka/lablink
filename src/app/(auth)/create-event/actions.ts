"use server";

import { requireAuth } from "@/lib/auth/server-auth";
import { userGroupAdminRepo } from "@/infra/group/user-group-admin-repository";
import { firestoreEventAdminRepository } from "@/infra/event/event-admin-repo";
import type { NewEvent } from "@/domain/event";

export async function createEventAction(
    groupId: string,
    eventData: NewEvent,
): Promise<{ success: true; eventId: string } | { success: false; error: string }> {
    const decodedClaims = await requireAuth();
    const userId = decodedClaims.uid;

    try {
        const memberIdsResult =
            await userGroupAdminRepo.findUserIdsByGroupId(groupId);

        if (memberIdsResult.isErr()) {
            return { success: false, error: "グループ情報の取得に失敗しました" };
        }

        if (!memberIdsResult.value.includes(userId)) {
            return {
                success: false,
                error: "このグループへのアクセス権限がありません",
            };
        }

        const result = await firestoreEventAdminRepository.createEvent(
            groupId,
            eventData,
        );

        return result.match(
            (event) => ({ success: true, eventId: event.id }),
            (err) => ({ success: false, error: err.message }),
        );
    } catch (error) {
        const message =
            error instanceof Error ? error.message : String(error);
        console.error("Failed to create event:", message);
        return { success: false, error: "イベントの作成中にエラーが発生しました" };
    }
}
