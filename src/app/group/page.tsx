"use client";

import React, { useState } from "react";
import EventList from "./_components/event-list";
import GroupView, { Group } from "./_components/group-list";
import GroupListSidebar from "./_components/group-list-sidebar";
import { Event } from "@/domain/event";
import useSWR from "swr";
import { collection, getDocs, query as q, orderBy } from "firebase/firestore";
import { db } from "@/firebase/client";

// TODO: 実際のデータ取得に置き換える
const mockGroups: Group[] = [
    {
        name: "原研",
        members: [],
    },
    {
        name: "GDGoC osaka",
        members: [
            { id: "1", name: "tanigaki kei" },
            { id: "2", name: "suyama souta" },
            { id: "3", name: "yoshida kazuya" },
            { id: "4", name: "siomi ayari" },
            { id: "5", name: "itaya kosuke" },
            { id: "6", name: "yamamoto sakura" },
        ],
    },
];

// イベントをFirestoreから取得するためのfetcher
const fetchEvents = async (): Promise<Event[]> => {
    const col = collection(db, "events");
    const qRef = q(col, orderBy("begin_at", "asc"));
    const snap = await getDocs(qRef);
    return snap.docs.map((d) => {
        const data = d.data() as any;
        return {
            id: d.id,
            title: data.title,
            description: data.description,
            begin_at: data.begin_at,
            end_at: data.end_at,
            created_at: data.created_at || new Date(),
            updated_at: data.updated_at || new Date(),
        } as Event;
    });
};

const GroupPage = () => {
    const [selectedGroupId, setSelectedGroupId] = useState<string>(
        mockGroups[0].name,
    );
    const selectedGroup =
        mockGroups.find((group) => group.name === selectedGroupId) ||
        mockGroups[0];

    // SWR を利用して Firestore からイベント一覧を取得
    const { data: events, error, isLoading } = useSWR("/events", fetchEvents);

    return (
        <main className="flex min-h-screen bg-white">
            {/* 左端カラム - グループ一覧 */}
            <GroupListSidebar
                groups={mockGroups}
                selectedGroupId={selectedGroupId}
                onGroupSelect={setSelectedGroupId}
            />

            {/* 中央カラム - 選択されたグループのメンバー一覧 */}
            <div className="w-80">
                <GroupView group={selectedGroup} />
            </div>

            {/* 右端カラム - イベント一覧 */}
            <div className="flex-1">
                <EventList events={events ?? []} />
            </div>
        </main>
    );
};

export default GroupPage;
