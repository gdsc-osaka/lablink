"use server";

import { requireAuth } from "@/lib/auth/server-auth";
import { createGroupService } from "@/service/group-service";
import { firestoreGroupAdminRepository } from "@/infra/group/group-admin-repo";
import { userGroupAdminRepo } from "@/infra/group/user-group-admin-repository";
import { isGroupRole } from "@/domain/group";
import { firestoreEventAdminRepository } from "@/infra/event/event-admin-repo";
import { revalidatePath } from "next/cache";

export async function authorizeGroupMember(
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

const groupService = createGroupService({
    groupRepo: firestoreGroupAdminRepository,
    userGroupRepo: userGroupAdminRepo,
});

export async function removeMemberAction(
    groupId: string,
    targetUserId: string,
): Promise<{ success: true } | { success: false; error: string }> {
    const decodedClaims = await requireAuth();
    const requesterId = decodedClaims.uid;

    const result = await groupService.removeMember(
        groupId,
        requesterId,
        targetUserId,
    );

    return result.match(
        () => ({ success: true as const }),
        (err) => ({ success: false, error: err.message }),
    );
}

export async function changeMemberRoleAction(
    groupId: string,
    targetUserId: string,
    newRole: unknown,
): Promise<{ success: true } | { success: false; error: string }> {
    const decodedClaims = await requireAuth();
    const requesterId = decodedClaims.uid;

    if (!isGroupRole(newRole) || newRole === "owner") {
        return { success: false, error: "無効なロールが指定されました" };
    }

    const result = await groupService.changeMemberRole(
        groupId,
        requesterId,
        targetUserId,
        newRole,
    );

    return result.match(
        () => ({ success: true as const }),
        (err) => ({ success: false, error: err.message }),
    );
}

export async function transferOwnershipAction(
    groupId: string,
    newOwnerId: string,
): Promise<{ success: true } | { success: false; error: string }> {
    const decodedClaims = await requireAuth();
    const currentOwnerId = decodedClaims.uid;

    const result = await groupService.transferOwnership(
        groupId,
        currentOwnerId,
        newOwnerId,
    );

    return result.match(
        () => ({ success: true as const }),
        (err) => ({ success: false, error: err.message }),
    );
}
