"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/server-auth";
import { createGroupService } from "@/service/group-service";
import { firestoreGroupAdminRepository } from "@/infra/group/group-admin-repo";
import { userGroupAdminRepo } from "@/infra/group/user-group-admin-repository";

export async function removeGroupMember(
    groupId: string,
    userId: string,
): Promise<{ success: boolean; error?: string }> {
    // 認証確認（Next.js の redirect() を try-catch で捕まえないよう外に出す）
    await requireAuth();

    try {
        // サービスインスタンスを組み立て
        const groupService = createGroupService({
            groupRepo: firestoreGroupAdminRepository,
            userGroupRepo: userGroupAdminRepo,
        });

        // メンバー削除実行
        const result = await groupService.removeGroupMember(groupId, userId);

        if (result.isErr()) {
            return {
                success: false,
                error: result.error.message || "メンバー削除に失敗しました",
            };
        }

        revalidatePath("/group");
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Failed to remove group member:", message);
        return {
            success: false,
            error: "メンバー削除中にエラーが発生しました",
        };
    }
}
