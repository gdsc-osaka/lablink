import { requireAuth } from "@/lib/auth/server-auth";
import { groupService, GroupWithMembers } from "@/service/group-service";
import { Event } from "@/domain/event";
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

    // ユーザーが所属するグループ一覧（メンバー情報込み）を取得
    const groupsResult = await groupService.getGroupsWithMembersByUserId(user.uid);
    let groups: GroupWithMembers[] = [];
    let errorMessage: string | null = null;
    await groupsResult.match(
        (data: GroupWithMembers[]) => {
            groups = data;
            return null;
        },
        (error: ServiceError) => {
            errorMessage = error.message || "グループ情報の取得中にエラーが発生しました。";
            return null;
        }
    );

    // 選択されたグループ（デフォルトは最初のグループ）
    const selectedGroup = selectedGroupId
        ? groups.find((g) => g.id === selectedGroupId)
        : groups[0];

    // TODO: イベント一覧を取得（event-serviceの実装が必要）
    const events: Event[] = [];

    return (
        <main className="flex min-h-screen bg-white">
            {errorMessage && (
                <div className="w-full bg-red-100 text-red-700 p-4 text-center font-semibold">
                    {errorMessage}
                </div>
            )}
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
