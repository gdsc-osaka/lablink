import { requireAuth } from "@/lib/auth/server-auth";
import { createGroupService } from "@/service/group-service";
import { firestoreGroupAdminRepository } from "@/infra/group/group-admin-repo";
import { userGroupAdminRepo } from "@/infra/group/user-group-admin-repository";
import { Suspense } from "react";
//サービスインスタンスを構築するためにinfraをインポートしていますが、diコンテナを別でつくった方がいいですか？
import { Event } from "@/domain/event";
import GroupPageClient from "./GroupPageClient";
import GroupView from "./_components/group-list";
import EventList from "./_components/event-list";
import { ErrorCircleIcon, GroupPeopleIcon, WarningTriangleIcon } from "./_components/icons";

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
    // エラーが発生した場合は専用のエラーUIを表示
    if (groupsResult.isErr()) {
        const errorMessage =
            groupsResult.error.message ||
            "グループ情報の取得中にエラーが発生しました。";
        return (
            <main className="flex min-h-screen bg-white items-center justify-center p-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <ErrorCircleIcon className="w-6 h-6 text-red-600" />
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

    const groups = groupsResult.value;

    // グループが存在しない場合の処理
    if (groups.length === 0) {
        return (
            <main className="flex min-h-screen bg-white items-center justify-center p-8">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 max-w-md shadow-lg text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <GroupPeopleIcon className="w-8 h-8 text-blue-600" />
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

    // 選択されたグループ（指定がない場合は最初のグループ）
    const selectedGroup = (() => {
        if (selectedGroupId) {
            const found = groups.find((g) => g.id === selectedGroupId);
            if (found) return found;
            // 無効なgroupIdの場合はundefinedを返す（エラー表示のため）
            return undefined;
        }
        return groups[0];
    })();

    // TODO: イベント一覧を取得（event-serviceの実装が必要）
    const events: Event[] = [];

    return (
        <main className="flex min-h-screen bg-white">
            {/* 左端カラム - グループ一覧（クライアントコンポーネント） */}
            <Suspense
                fallback={
                    <div className="w-64 border-r border-gray-200 bg-gray-50 h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                }
            >
                <GroupPageClient
                    groups={groups}
                    selectedGroupId={selectedGroup?.id}
                />
            </Suspense>

            {/* 中央カラム - 選択されたグループのメンバー一覧（サーバーコンポーネント） */}
            <div className="w-80 border-r border-gray-200">
                <Suspense
                    fallback={
                        <div className="h-full flex items-center justify-center bg-white">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    }
                >
                    {selectedGroup ? (
                        <GroupView group={selectedGroup} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-4 text-center text-gray-500">
                            <WarningTriangleIcon className="w-12 h-12 mb-2 text-gray-400" />
                            <p className="font-medium">グループが見つかりません</p>
                            <p className="text-sm mt-1">
                                選択されたグループは存在しないか、アクセス権限がありません。
                            </p>
                        </div>
                    )}
                </Suspense>
            </div>

            {/* 右端カラム - イベント一覧（サーバーコンポーネント） */}
            <div className="flex-1">
                <Suspense
                    fallback={
                        <div className="h-full flex items-center justify-center bg-gray-50">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    }
                >
                    {selectedGroup ? (
                        <EventList events={events} />
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50">
                            <p className="text-gray-400">
                                グループを選択してください
                            </p>
                        </div>
                    )}
                </Suspense>
            </div>
        </main>
    );
}
