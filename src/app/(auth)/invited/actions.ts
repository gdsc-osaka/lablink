"use server";

import { createInvitationService } from "@/service/invitation-service";
import { invitationRepo } from "@/infra/invitation/invitation-repo";
import { firestoreGroupAdminRepository } from "@/infra/group/group-admin-repo";
import { Group } from "@/domain/group";
import { InvitationError } from "@/domain/error";
import { requireAuth } from "@/lib/auth/server-auth";


/**
 * 招待を受け入れてグループに参加する Server Action
 */
export async function acceptGroupInvitation(
    token: string,
): Promise<{ success: boolean; groupId?: string; error?: string }> {
    const decodedClaims = await requireAuth();
    const userId = decodedClaims.uid;

    const invitationService = createInvitationService(invitationRepo, firestoreGroupAdminRepository);
    const result = await invitationService.acceptInvitation(token, userId);

    return result.match(
        (group: Group) => {
            // Transaction で招待の使用済みマークとメンバー追加が完了
            return { success: true, groupId: group.id };
        },
        (err: InvitationError) => ({ success: false, error: err.message }),
    );
}

/**
 * 招待を拒否する Server Action
 */
export async function declineGroupInvitation(
    token: string,
): Promise<{ success: boolean; error?: string }> {
    const service = createInvitationService(
        invitationRepo,
        firestoreGroupAdminRepository,
    );
    const result = await service.declineInvitation(token);

    return result.match(
        () => ({ success: true }),
        (err: InvitationError) => ({ success: false, error: err.message }),
    );
}
