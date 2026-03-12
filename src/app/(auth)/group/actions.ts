"use server";

import { requireAuth } from "@/lib/auth/server-auth";
import { createGroupService } from "@/service/group-service";
import { firestoreGroupAdminRepository } from "@/infra/group/group-admin-repo";
import { userGroupAdminRepo } from "@/infra/group/user-group-admin-repository";
import type { GroupRole } from "@/domain/group";

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
    newRole: Exclude<GroupRole, "owner">,
): Promise<{ success: true } | { success: false; error: string }> {
    const decodedClaims = await requireAuth();
    const requesterId = decodedClaims.uid;

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
