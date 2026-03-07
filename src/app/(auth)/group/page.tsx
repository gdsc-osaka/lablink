<<<<<<< HEAD
"use client";

import React, { useEffect, useMemo, useState } from "react";
import EventList from "./_components/event-list";
import GroupView, { Group } from "./_components/group-list";
import GroupListSidebar from "./_components/group-list-sidebar";
import { Event } from "@/domain/event";
import { useAuth } from "@/provider/AuthProvider";
import { createGroupService } from "@/service/group-service";
import { firestoreGroupRepository } from "@/infra/group/group-repo";
import { firestoreUserGroupRepository } from "@/infra/group/user-group-repository";
import { createEventService } from "@/service/event-service";
import { firestoreEventRepository } from "@/infra/event/event-repo";
import { userRepo } from "@/infra/user/user-repo";

const GroupPage = () => {
    const { user } = useAuth();
    const groupService = useMemo(
        () =>
            createGroupService({
                groupRepo: firestoreGroupRepository,
                userGroupRepo: firestoreUserGroupRepository,
            }),
        [],
    );
    const eventService = useMemo(
        () => createEventService(firestoreEventRepository),
        [],
    );

    const [groups, setGroups] = useState<Group[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(
        undefined,
    );
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchGroups = async () => {
            if (!user) {
                if (!isMounted) return;
                setGroups([]);
                setEvents([]);
                setSelectedGroupId(undefined);
                setIsLoadingGroups(false);
                return;
            }

            setIsLoadingGroups(true);
            setErrorMessage(null);

            const groupsResult = await groupService.getGroupsByUserId(user.uid);

            await groupsResult.match(
                async (fetchedGroups) => {
                    const groupsWithMembers = await Promise.all(
                        fetchedGroups.map(async (group) => {
                            const memberIdsResult =
                                await groupService.getMemberIdsByGroupId(
                                    group.id,
                                );

                            const members = await memberIdsResult.match(
                                async (memberIds) =>
                                    Promise.all(
                                        memberIds.map(async (memberId) => {
                                            const memberResult =
                                                await userRepo.findById(memberId);

                                            return memberResult.match(
                                                (member) => ({
                                                    id: memberId,
                                                    name:
                                                        member.email ?? memberId,
                                                }),
                                                () => ({
                                                    id: memberId,
                                                    name: memberId,
                                                }),
                                            );
                                        }),
                                    ),
                                () => [],
                            );

                            return {
                                id: group.id,
                                name: group.name,
                                members,
                            };
                        }),
                    );

                    if (!isMounted) return;
                    setGroups(groupsWithMembers);
                    setSelectedGroupId((currentSelectedGroupId) => {
                        if (
                            currentSelectedGroupId &&
                            groupsWithMembers.some(
                                (group) => group.id === currentSelectedGroupId,
                            )
                        ) {
                            return currentSelectedGroupId;
                        }

                        return groupsWithMembers[0]?.id;
                    });
                },
                (error) => {
                    if (!isMounted) return;
                    setGroups([]);
                    setSelectedGroupId(undefined);
                    setErrorMessage(error.message);
                },
            );

            if (!isMounted) return;
            setIsLoadingGroups(false);
        };

        fetchGroups();

        return () => {
            isMounted = false;
        };
    }, [groupService, user]);

    useEffect(() => {
        let isMounted = true;

        const fetchEvents = async () => {
            if (!selectedGroupId) {
                if (!isMounted) return;
                setEvents([]);
                return;
            }

            setIsLoadingEvents(true);
            setErrorMessage(null);

            const eventsResult = await eventService.getAllEvents(selectedGroupId);

            eventsResult.match(
                (fetchedEvents) => {
                    if (!isMounted) return;
                    setEvents(fetchedEvents);
                },
                (error) => {
                    if (!isMounted) return;

                    // イベント未登録時は正常系として空配列表示にする
                    if (/no events found/i.test(error.message)) {
                        setEvents([]);
                        return;
                    }

                    setEvents([]);
                    setErrorMessage(error.message);
                },
            );

            if (!isMounted) return;
            setIsLoadingEvents(false);
        };

        fetchEvents();

        return () => {
            isMounted = false;
        };
    }, [eventService, selectedGroupId]);

    const selectedGroup =
        groups.find((group) => group.id === selectedGroupId) ?? groups[0];

    if (isLoadingGroups) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-white">
                <p className="text-gray-600">グループ情報を読み込み中...</p>
=======
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
import {
    ErrorCircleIcon,
    GroupPeopleIcon,
    WarningTriangleIcon,
} from "./_components/icons";

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
>>>>>>> origin/main
            </main>
        );
    }

<<<<<<< HEAD
    if (!selectedGroup) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-white">
                <p className="text-gray-600">
                    参加中のグループがありません。招待を受け取るか、グループを作成してください。
                </p>
=======
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
>>>>>>> origin/main
            </main>
        );
    }

<<<<<<< HEAD
    return (
        <main className="flex min-h-screen bg-white">
            {/* 左端カラム - グループ一覧 */}
            <GroupListSidebar
                groups={groups}
                selectedGroupId={selectedGroupId}
                onGroupSelect={setSelectedGroupId}
            />

            {/* 中央カラム - 選択されたグループのメンバー一覧 */}
            <div className="w-80">
                <GroupView group={selectedGroup} />
            </div>

            {/* 右端カラム - イベント一覧 */}
            <div className="flex-1">
                {errorMessage && (
                    <p className="px-8 pt-8 text-sm text-red-600">
                        {errorMessage}
                    </p>
                )}
                {isLoadingEvents ? (
                    <div className="flex min-h-screen items-center justify-center bg-white">
                        <p className="text-gray-600">イベント情報を読み込み中...</p>
                    </div>
                ) : (
                    <EventList events={events} />
                )}
            </div>
        </main>
    );
};

export default GroupPage;
=======
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
                            <p className="font-medium">
                                グループが見つかりません
                            </p>
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
>>>>>>> origin/main
