import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { formatToJST } from "@/lib/date";

type EventListCardProps = {
    id: string;
    title: string;
    startTime: Timestamp;
    endTime: Timestamp;
};

const EventListCard = ({
    id,
    title,
    startTime,
    endTime,
}: EventListCardProps) => {
    // propsで受け取ったTimestampをDateオブジェクトに変換
    const startDate = startTime.toDate();
    const endDate = endTime.toDate();

    // 日付と時刻を指定の形式にフォーマット
    const formattedDate = formatToJST(startDate, "yyyy/MM/dd");
    const formattedStartTime = formatToJST(startDate, "HH:mm");
    const formattedEndTime = formatToJST(endDate, "HH:mm");

    // 表示用の文字列を組み立てる
    const displayDateTime = `${formattedDate} ${formattedStartTime}～${formattedEndTime}`;

    return (
        <div className="bg-gray-50 p-6 rounded-lg shadow-md flex justify-between items-start hover:shadow-lg transition-shadow">
            <div className="flex-1">
                <h3 className="text-xl font-bold text-black mb-2">{title}</h3>
                <p className="text-base text-black">{displayDateTime}</p>
            </div>
            <Link href={`/edit-event?id=${id}`}>
                <Button className="bg-gray-100 hover:bg-gray-200 text-black text-sm font-medium py-2 px-4 border border-gray-300 rounded-md transition-colors ml-4">
                    編集
                </Button>
            </Link>
        </div>
    );
};

export default EventListCard;
