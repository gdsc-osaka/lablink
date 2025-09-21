// src/components/EventList.tsx
import EventListCard from "./event-list-card";
import Link from "next/link";
import { Event } from "../types";

interface EventListProps {
    events: Event[];
}

const EventList = ({ events }: EventListProps) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-start min-h-screen bg-white">
            {/* タイトル */}
            <div className="w-full max-w-4xl px-8 pt-8">
                <h2 className="text-3xl font-bold text-black text-center mb-8">
                    イベント一覧
                </h2>
            </div>

            {/* イベントリスト */}
            <div className="w-full max-w-4xl px-8 space-y-6">
                {events.length > 0 ? (
                    events.map((event) => (
                        <EventListCard
                            key={event.id}
                            id={event.id}
                            title={event.title}
                            startTime={event.startTime}
                            endTime={event.endTime}
                        />
                    ))
                ) : (
                    <p className="text-center text-gray-500">
                        表示できるイベントがありません。
                    </p>
                )}
            </div>

            {/* イベント追加ボタン */}
            <div className="w-full max-w-4xl px-8 mt-8 pb-8">
                <div className="flex justify-end">
                    <Link href="/create-event">
                        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                            イベント追加
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default EventList;
