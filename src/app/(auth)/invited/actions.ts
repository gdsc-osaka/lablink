"use server";

import { createInvitationService } from "@/service/invitation-service";
import { invitationRepo } from "@/infra/invitation/invitation-repo";
import { firestoreGroupAdminRepository } from "@/infra/group/group-admin-repo";
import { getAuthAdmin } from "@/firebase/admin";
import { cookies } from "next/headers";
import { Group } from "@/domain/group";
import { InvitationError } from "@/domain/error";


/**
 * 招待を受け入れてグループに参加する Server Action
 */
export async function acceptGroupInvitation(
    token: string,
): Promise<{ success: boolean; groupId?: string; error?: string }> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
        return { success: false, error: "ログインしてください" };
    }

    let userId: string;
    try {
        const authAdmin = getAuthAdmin();
        const decodedClaims = await authAdmin.verifySessionCookie(
            sessionCookie,
            true,
        );
        userId = decodedClaims.uid;
    } catch (error) {
        return { success: false, error: "認証に失敗しました" };
    }

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
