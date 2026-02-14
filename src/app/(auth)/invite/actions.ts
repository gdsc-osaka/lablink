"use server";

import { createInvitationService } from "@/service/invitation-service";
import { invitationRepo } from "@/infra/invitation/invitation-repo";
import { firestoreGroupAdminRepository } from "@/infra/group/group-admin-repo";
import type { Invitation } from "@/domain/invitation";
import type { InvitationError } from "@/domain/error";

export async function createInvitationAction(
    groupId: string,
): Promise<
    | { success: true; token: string }
    | { success: false; error: string }
> {
    if (!groupId) {
        return { success: false, error: "グループIDが指定されていません" };
    }

    const invitationService = createInvitationService(
        invitationRepo,
        firestoreGroupAdminRepository,
    );

    const result = await invitationService.createInvitation(groupId);

    return result.match(
        (invitation: Invitation) => ({
            success: true,
            token: invitation.token,
        }),
        (err: InvitationError) => ({
            success: false,
            error: err.message,
        }),
    );
}
