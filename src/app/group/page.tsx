"use client";

import React, { useState, useEffect } from "react";
import EventList from "./_components/event-list";
import GroupView, { Group } from "./_components/group-list";
import GroupListSidebar from "./_components/group-list-sidebar";
import { Event } from "@/domain/event";
import { Timestamp } from "firebase/firestore";
import { useUserGroups, useGroupMembers } from "@/hooks/group";
import { useAuth } from "@/provider/AuthProvider";
import { userRepo } from "@/infra/user/user-repo";
import { groupService } from "@/di";
// TODO: 実際のデータ取得に置き換える

// TODO: 実際のデータ取得に置き換える
const mockEvents: Event[] = [
    {
        id: "101",
        title: "交流会",
        description:
            "新しく研究室配属された学部4年の学生の歓迎会としてたこ焼きパーティーをする",
        begin_at: Timestamp.fromDate(new Date("2025-05-12T13:00:00Z")),
        end_at: Timestamp.fromDate(new Date("2025-05-12T16:00:00Z")),
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        id: "102",
        title: "ミーティング",
        description: "外部進学した留学生のためにたこ焼きパーティーをする",
        begin_at: Timestamp.fromDate(new Date("2025-05-23T11:00:00Z")),
        end_at: Timestamp.fromDate(new Date("2025-05-23T12:00:00Z")),
        created_at: new Date(),
        updated_at: new Date(),
    },
];

const GroupPage = () => {
    const { user } = useAuth();
    // テスト用の固定ID
    const currentUserId = "test@example.com";
    const { groups, loading: groupsLoading } = useUserGroups(currentUserId);

    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const currentGroupId = selectedGroupId ?? groups[0]?.id;

    const { members, loading: membersLoading } =
        useGroupMembers(currentGroupId);

    const selectedGroupData = groups.find((g) => g.id === currentGroupId);

    const groupForDisplay = selectedGroupData
        ? {
              ...selectedGroupData,
              members: members,
          }
        : null;

    //以下テスト用(あとで削除)
    const handleSeedData = async () => {
        if (!confirm("テストデータを作成しますか？")) return;

        try {
            // ユーザーを作成
            await userRepo.create({
                id: currentUserId,
                email: currentUserId,
                name: "テストユーザー",
                created_at: Timestamp.now(),
                updated_at: Timestamp.now(),
            });

            // グループを作成し、このユーザーをオーナーとして追加
            await groupService.createGroupAndAddOwner(currentUserId, {
                name: "原研究室（テスト）",
            });

            await groupService.createGroupAndAddOwner(currentUserId, {
                name: "GDGoC Osaka（テスト）",
            });

            alert("作成完了！画面をリロードしてください。");
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert("エラーが発生しました。コンソールを確認してください。");
        }
    };

    if (groupsLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                読み込み中...
            </div>
        );
    }

    if (groups.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>グループに参加していません</p>
                {/* 以下テスト用(あとで削除) */}
                <button
                    onClick={handleSeedData}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    テストデータを作成する
                </button>
            </div>
        );
    }

    return (
        <main className="flex min-h-screen bg-white">
            {/* 左端カラム - グループ一覧 */}
            <GroupListSidebar
                groups={groups}
                selectedGroupId={currentGroupId}
                onGroupSelect={(id) => setSelectedGroupId(id)}
            />

            {/* 中央カラム - 選択されたグループのメンバー一覧 */}
            <div className="w-80">
                {groupForDisplay && <GroupView group={groupForDisplay} />}
            </div>

            {/* 右端カラム - イベント一覧 */}
            <div className="flex-1">
                <EventList events={mockEvents} />
            </div>
        </main>
    );
};

export default GroupPage;
