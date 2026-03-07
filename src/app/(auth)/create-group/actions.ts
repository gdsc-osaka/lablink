"use server";

import { createGroupService } from "@/service/group-service";
import { firestoreGroupAdminRepository } from "@/infra/group/group-admin-repo";
import { userGroupAdminRepo } from "@/infra/group/user-group-admin-repository";
import type { ServiceError } from "@/domain/error";
import { requireAuth } from "@/lib/auth/server-auth";

export async function createGroupAction(
    name: string,
): Promise<{ success: true; groupId: string } | { success: false; error: string }> {
    const decodedClaims = await requireAuth();
    const userId = decodedClaims.uid;

    const groupService = createGroupService({
        groupRepo: firestoreGroupAdminRepository,
        userGroupRepo: userGroupAdminRepo,
    });

    const result = await groupService.createGroupAndAddOwner(userId, { name });

    return result.match(
        (group) => ({ success: true, groupId: group.id }),
        (err: ServiceError) => ({ success: false, error: err.message }),
    );
}
