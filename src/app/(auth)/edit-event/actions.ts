"use server";

import { requireAuth } from "@/lib/auth/server-auth";
import { userGroupAdminRepo } from "@/infra/group/user-group-admin-repository";
import { firestoreEventAdminRepository } from "@/infra/event/event-admin-repo";
import type { Event } from "@/domain/event";
import { revalidatePath } from "next/cache";

async function authorizeGroupMember(
    groupId: string,
    userId: string,
): Promise<{ authorized: true } | { authorized: false; error: string }> {
    const memberIdsResult =
        await userGroupAdminRepo.getUserIdsByGroupId(groupId);
    if (memberIdsResult.isErr()) {
        return { authorized: false, error: "グループ情報の取得に失敗しました" };
    }
    if (!memberIdsResult.value.includes(userId)) {
        return {
            authorized: false,
            error: "このグループへのアクセス権限がありません",
        };
    }
    return { authorized: true };
}

export async function updateEventAction(
    groupId: string,
    event: Event,
): Promise<{ success: true } | { success: false; error: string }> {
    const decodedClaims = await requireAuth();
    const auth = await authorizeGroupMember(groupId, decodedClaims.uid);
    if (!auth.authorized) {
        return { success: false, error: auth.error };
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
    const auth = await authorizeGroupMember(groupId, decodedClaims.uid);
    if (!auth.authorized) {
        return { success: false, error: auth.error };
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
