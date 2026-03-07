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
            </main>
        );
    }

    if (!selectedGroup) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-white">
                <p className="text-gray-600">
                    参加中のグループがありません。招待を受け取るか、グループを作成してください。
                </p>
            </main>
        );
    }

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
