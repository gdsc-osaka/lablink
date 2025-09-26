// src/app/group/page.tsx
import EventList from "@/components/event-list";
import { Event } from "@/domain/event";
import { Timestamp } from "firebase/firestore";

const groupEvents: Event[] = [
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
  return (
    <main className="flex min-h-screen bg-white">
      {/* サイドバー用のスペース（25-30%の幅） */}
      <div className="w-1/4 bg-gray-100"></div>

      {/* メインコンテンツエリア */}
      <div className="flex-1">
        <EventList events={groupEvents} />
      </div>
    </main>
  );
};

export default GroupPage;
