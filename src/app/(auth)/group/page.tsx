import { requireAuth } from "@/lib/auth/server-auth";
import { createGroupService } from "@/service/group-service";
import { firestoreGroupAdminRepository } from "@/infra/group/group-admin-repo";
import { userGroupAdminRepo } from "@/infra/group/user-group-admin-repository";
//サービスインスタンスを構築するためにinfraをインポートしていますが、diコンテナを別でつくった方がいいですか？
import { Event } from "@/domain/event";
import { GroupWithMembers } from "@/domain/group";
import { ServiceError } from "@/domain/error";
import GroupPageClient from "./GroupPageClient";
import GroupView from "./_components/group-list";
import EventList from "./_components/event-list";

interface PageProps {
    searchParams: Promise<{ groupId?: string }>;
}

export default async function GroupPage({ searchParams }: PageProps) {
    const user = await requireAuth();
    const params = await searchParams;
    const selectedGroupId = params.groupId;

    // サービスインスタンスを都度組み立て
    const groupService = createGroupService({
        groupRepo: firestoreGroupAdminRepository,
        userGroupRepo: userGroupAdminRepo,
    });

    // ユーザーが所属するグループ一覧（メンバー情報込み）を取得
    const groupsResult = await groupService.getGroupsWithMembersByUserId(
        user.uid,
    );
    const { groups, errorMessage } = groupsResult.match(
        (data: GroupWithMembers[]) => ({
            groups: data,
            errorMessage: null,
        }),
        (error: ServiceError) => ({
            groups: [],
            errorMessage:
                error.message || "グループ情報の取得中にエラーが発生しました。",
        }),
    );

    // エラーが発生した場合は専用のエラーUIを表示
    if (errorMessage) {
        return (
            <main className="flex min-h-screen bg-white items-center justify-center p-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <svg
                                className="w-6 h-6 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-red-800">
                            エラーが発生しました
                        </h2>
                    </div>
                    <p className="text-red-700 mb-4">{errorMessage}</p>
                    <p className="text-sm text-red-600">
                        ページを再読み込みしてお試しください。
                    </p>
                </div>
            </main>
        );
    }

    // グループが存在しない場合の処理
    if (groups.length === 0) {
        return (
            <main className="flex min-h-screen bg-white items-center justify-center p-8">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 max-w-md shadow-lg text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-blue-800 mb-2">
                        グループがありません
                    </h2>
                    <p className="text-blue-700 mb-6">
                        まだグループに参加していないか、グループを作成していません。
                    </p>
                    <a
                        href="/create-group"
                        className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                    >
                        グループを作成
                    </a>
                </div>
            </main>
        );
    }

    // 選択されたグループ（デフォルトは最初のグループ）
    const selectedGroup = (() => {
        if (selectedGroupId) {
            const found = groups.find((g) => g.id === selectedGroupId);
            if (found) return found;
            // 無効なgroupIdの場合は最初のグループにフォールバック
            console.warn(`Group ID not found: ${selectedGroupId}, using first group`);
        }
        return groups[0];
    })();

    // TODO: イベント一覧を取得（event-serviceの実装が必要）
    const events: Event[] = [];

    return (
        <main className="flex min-h-screen bg-white">
            {/* 左端カラム - グループ一覧（クライアントコンポーネント） */}
            <GroupPageClient
                groups={groups}
                selectedGroupId={selectedGroup?.id}
            />

            {/* 中央カラム - 選択されたグループのメンバー一覧（サーバーコンポーネント） */}
            <div className="w-80">
                {selectedGroup && <GroupView group={selectedGroup} />}
            </div>

            {/* 右端カラム - イベント一覧（サーバーコンポーネント） */}
            <div className="flex-1">
                <EventList events={events} />
            </div>
        </main>
    );
}
