// src/components/event-list-card.tsx
import { format } from "date-fns";
import Link from "next/link";

type EventListCardProps = {
    id: number;
    title: string;
    startTime: string | Date;
    endTime: string | Date;
};

const EventListCard = ({
    id,
    title,
    startTime,
    endTime,
}: EventListCardProps) => {
    // propsで受け取った日時文字列をDateオブジェクトに変換
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // 日付と時刻を指定の形式にフォーマット
    const formattedDate = format(startDate, "yyyy/MM/dd");
    const formattedStartTime = format(startDate, "HH:mm");
    const formattedEndTime = format(endDate, "HH:mm");

    // 表示用の文字列を組み立てる
    const displayDateTime = `${formattedDate} ${formattedStartTime}～${formattedEndTime}`;

    return (
        <div className="bg-gray-50 p-6 rounded-lg shadow-md flex justify-between items-start hover:shadow-lg transition-shadow">
            <div className="flex-1">
                <h3 className="text-xl font-bold text-black mb-2">{title}</h3>
                <p className="text-base text-black">{displayDateTime}</p>
            </div>
            <Link href={`/edit-event?id=${id}`}>
                <button className="bg-gray-100 hover:bg-gray-200 text-black text-sm font-medium py-2 px-4 border border-gray-300 rounded-md transition-colors ml-4">
                    編集
                </button>
            </Link>
        </div>
    );
};

export default EventListCard;
