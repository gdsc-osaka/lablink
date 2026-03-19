import { requireAuth } from "@/lib/auth/server-auth";
import { userGroupAdminRepo } from "@/infra/group/user-group-admin-repository";
import { findUsersByIds } from "@/infra/user/user-admin-repo";
import CreateEventForm from "./CreateEventForm";

interface Props {
    searchParams: Promise<{ groupId?: string }>;
}

export default async function CreateEventPage({ searchParams }: Props) {
    await requireAuth();
    const { groupId } = await searchParams;

    const errorLayout = (message: string) => (
        <main className="min-h-screen bg-white">
            <div className="w-full mx-auto">
                <div className="flex w-full h-25 bg-gray-300">
                    <h1 className="text-4xl font-bold text-black py-8 ml-10">
                        新規イベントを作成
                    </h1>
                </div>
                <div className="p-8">
                    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {message}
                    </div>
                </div>
            </div>
        </main>
    );

    if (!groupId) {
        return errorLayout(
            "エラー: グループIDが指定されていません。正しいURLからアクセスしてください。",
        );
    }

    const membersResult =
        await userGroupAdminRepo.findMembersWithRoles(groupId);
    if (membersResult.isErr()) {
        return errorLayout("グループメンバーの取得に失敗しました。");
    }

    const memberIds = membersResult.value.map((m) => m.userId);
    const userMapResult = await findUsersByIds(memberIds);
    if (userMapResult.isErr()) {
        return errorLayout("ユーザー情報の取得に失敗しました。");
    }

    const users = Array.from(userMapResult.value.values()).map((u) => ({
        id: u.uid,
        username: u.email,
        email: u.email,
    }));

    return (
        <main className="min-h-screen bg-white">
            <div className="w-full mx-auto">
                <div className="flex w-full h-25 bg-gray-300">
                    <h1 className="text-4xl font-bold text-black py-8 ml-10">
                        新規イベントを作成
                    </h1>
                </div>
                <CreateEventForm groupId={groupId} users={users} />
            </div>
        </main>
    );
}
