"use server";

import { createInvitationService } from "@/service/invitation-service";
import { invitationRepo } from "@/infra/invitation/invitation-repo";
import { firestoreGroupRepository } from "@/infra/group/group-repo";
import { firestoreUserGroupRepository } from "@/infra/group/user-group-repository";
import { authAdmin } from "@/firebase/admin";
import { cookies } from "next/headers";

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
        const decodedClaims = await authAdmin.verifySessionCookie(
            sessionCookie,
            true,
        );
        userId = decodedClaims.uid;
    } catch (error) {
        return { success: false, error: "認証に失敗しました" };
    }
    const service = createInvitationService(
        invitationRepo,
        firestoreGroupRepository,
        firestoreUserGroupRepository,
    );

    const result = await service.acceptInvitation(token, userId);

    return result.match(
        (group) => {
            // 招待が使用済みにマークされる（invitationRepo.markAsUsed で自動実行）
            return { success: true, groupId: group.id };
        },
        (err) => ({ success: false, error: err.message }),
    );
}

/**
 * 招待を拒否する Server Action
 */
export async function declineGroupInvitation(): Promise<{
    success: boolean;
}> {
    return { success: true };
}
