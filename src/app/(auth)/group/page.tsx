"use client";

import React, { useState, useEffect } from "react";
import EventList from "./_components/event-list";
import GroupView, { Group as GroupUI } from "./_components/group-list";
import GroupListSidebar from "./_components/group-list-sidebar";
import { Event } from "@/domain/event";
import { useAuth } from "@/provider/AuthProvider";
import { firestoreUserGroupRepository } from "@/infra/group/user-group-repository";
import { firestoreEventRepository } from "@/infra/event/event-repo";
import type { Group as DomainGroup } from "@/domain/group";

const GroupPage = () => {
    const { user, loading } = useAuth();
    const [groups, setGroups] = useState<DomainGroup[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string>("");

    // Firebaseからグループとイベントを取得
    useEffect(() => {
        if (loading || !user) return;

        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                // ユーザーのグループを取得
                const groupsResult = await firestoreUserGroupRepository
                    .findAllByUserId(user.uid)
                    .mapErr((err) => {
                        console.error("グループ取得エラー:", err);
                        return err;
                    });

                groupsResult.match(
                    (fetchedGroups) => {
                        setGroups(fetchedGroups);
                        if (
                            fetchedGroups.length > 0 &&
                            !selectedGroupId
                        ) {
                            setSelectedGroupId(fetchedGroups[0].id);
                        }
                    },
                    (err) =>
                        console.error("グループ取得に失敗しました:", err),
                );
            } catch (error) {
                console.error("エラーが発生しました:", error);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, [user, loading, selectedGroupId]);

    // 選択されたグループのイベントを取得
    useEffect(() => {
        if (!selectedGroupId || isLoadingData) return;

        const fetchEvents = async () => {
            try {
                const eventsResult = await firestoreEventRepository
                    .findAll(selectedGroupId)
                    .mapErr((err) => {
                        console.error("イベント取得エラー:", err);
                        return err;
                    });

                eventsResult.match(
                    (fetchedEvents) => setEvents(fetchedEvents),
                    (err) =>
                        console.error("イベント取得に失敗しました:", err),
                );
            } catch (error) {
                console.error("エラーが発生しました:", error);
            }
        };

        fetchEvents();
    }, [selectedGroupId, isLoadingData]);

    const selectedGroup =
        groups.find((group) => group.id === selectedGroupId) || groups[0];

    // UI用にmembersプロパティを追加（現在は空配列、将来的にFirebaseから取得予定）
    const groupWithMembers: GroupUI | null = selectedGroup
        ? { ...selectedGroup, members: [] }
        : null;

    // GroupsをUIの型に変換
    const groupsUI: GroupUI[] = groups.map((g) => ({ ...g, members: [] }));

    return (
        <main className="flex min-h-screen bg-white">
            {loading || isLoadingData ? (
                <div className="flex items-center justify-center w-full">
                    <p>読み込み中...</p>
                </div>
            ) : groups.length === 0 ? (
                <div className="flex items-center justify-center w-full">
                    <p>グループがありません</p>
                </div>
            ) : (
                <>UI
                    {/* 左端カラム - グループ一覧 */}
                    <GroupListSidebar
                        groups={groups.map((g) => ({ ...g, members: [] }))}
                        selectedGroupId={selectedGroupId}
                        onGroupSelect={setSelectedGroupId}
                    />

                    {/* 中央カラム - 選択されたグループのメンバー一覧 */}
                    <div className="w-80">
                        {groupWithMembers && (
                            <GroupView group={groupWithMembers} />
                        )}
                    </div>

                    {/* 右端カラム - イベント一覧 */}
                    <div className="flex-1">
                        <EventList events={events} />
                    </div>
                </>
            )}
        </main>
    );
};

export default GroupPage;
