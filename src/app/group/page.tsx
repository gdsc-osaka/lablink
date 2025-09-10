// src/app/group/page.tsx
import EventList from '@/components/event-list';
import { Event } from '@/types';

const groupEvents: Event[] = [
  { id: 101, title: '交流会', startTime: '2025-05-12T13:00:00Z', endTime: '2025-05-12T16:00:00Z' },
  { id: 102, title: 'ミーティング', startTime: '2025-05-23T11:00:00Z', endTime: '2025-05-23T12:00:00Z' },
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