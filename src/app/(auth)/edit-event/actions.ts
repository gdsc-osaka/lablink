"use server";

import { requireAuth } from "@/lib/auth/server-auth";
import { userGroupAdminRepo } from "@/infra/group/user-group-admin-repository";
import { firestoreEventAdminRepository } from "@/infra/event/event-admin-repo";
import type { Event } from "@/domain/event";
import { revalidatePath } from "next/cache";

export async function updateEventAction(
    groupId: string,
    event: Event,
): Promise<{ success: true } | { success: false; error: string }> {
    const decodedClaims = await requireAuth();
    const userId = decodedClaims.uid;

    const memberIdsResult =
        await userGroupAdminRepo.getUserIdsByGroupId(groupId);
    if (memberIdsResult.isErr()) {
        return { success: false, error: "グループ情報の取得に失敗しました" };
    }
    if (!memberIdsResult.value.includes(userId)) {
        return {
            success: false,
            error: "このグループへのアクセス権限がありません",
        };
    }

    const result = await firestoreEventAdminRepository.updateNewEvent(
        groupId,
        event,
    );
    return result.match(
        () => {
            revalidatePath("/group");
            return { success: true as const };
        },
        (err) => ({ success: false, error: err.message }),
    );
}

export async function deleteEventAction(
    groupId: string,
    eventId: string,
): Promise<{ success: true } | { success: false; error: string }> {
    const decodedClaims = await requireAuth();
    const userId = decodedClaims.uid;

    const memberIdsResult =
        await userGroupAdminRepo.getUserIdsByGroupId(groupId);
    if (memberIdsResult.isErr()) {
        return { success: false, error: "グループ情報の取得に失敗しました" };
    }
    if (!memberIdsResult.value.includes(userId)) {
        return {
            success: false,
            error: "このグループへのアクセス権限がありません",
        };
    }

    const result = await firestoreEventAdminRepository.deleteNewEvent(
        groupId,
        eventId,
    );
    return result.match(
        () => {
            revalidatePath("/group");
            return { success: true as const };
        },
        (err) => ({ success: false, error: err.message }),
    );
}
