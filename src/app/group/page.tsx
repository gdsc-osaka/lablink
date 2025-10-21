"use client";

import React, { useState } from "react";
import EventList from "./_components/event-list";
import GroupView, { Group } from "./_components/group-list";
import GroupListSidebar from "./_components/group-list-sidebar";
import { Event } from "@/domain/event";
import { Timestamp } from "firebase/firestore";

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
    const [selectedGroupId, setSelectedGroupId] = useState<string>(
        mockGroups[0].name,
    );
    const selectedGroup =
        mockGroups.find((group) => group.name === selectedGroupId) ||
        mockGroups[0];

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
                <EventList events={mockEvents} />
            </div>
        </main>
    );
};

export default GroupPage;
