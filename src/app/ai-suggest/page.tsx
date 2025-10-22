"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SuggestedDate {
    id: string;
    date: string;
    timeRange: string;
}

export default function AISuggestPage() {
    const router = useRouter();
    const [selectedDateId, setSelectedDateId] = useState<string | null>(null);

    // 仮データ - 今後Firestoreから取得予定
    const suggestedDates: SuggestedDate[] = [
        {
            id: "1",
            date: "2025/05/12",
            timeRange: "11:00~12:00",
        },
        {
            id: "2",
            date: "2025/05/13",
            timeRange: "12:00~13:00",
        },
        {
            id: "3",
            date: "2025/05/16",
            timeRange: "12:00~13:00",
        },
    ];

    const handleDateSelect = (dateId: string) => {
        setSelectedDateId(dateId);
    };

    const handleConfirm = () => {
        if (selectedDateId) {
            // 新規イベント作成完了ページに遷移
            router.push("/complete");
        }
    };

    const handleViewOtherDates = () => {
        // TODO: 他の日程を見る機能を実装
        console.log("他の日程を見る");
    };

    // AI提案日程が無い場合の表示
    if (suggestedDates.length === 0) {
        return ( 
        <div className="min-h-screen bg-white">
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <h1 className="text-2xl font-bold text-black mb-8">
                        新規イベントを作成
                    </h1>
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">
                            AIによる日程提案がありません。
                        </p>
                        <p className="text-gray-600 mb-8">
                            手動で日程を設定してください。
                        </p>
                        <button
                            onClick={() => router.push("/")}
                            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                        >
                            ホームに戻る
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* ヘッダー */}
            <div className="flex w-full h-25 bg-gray-300">
                <h1 className="text-4xl font-bold text-black py-8 ml-10">
                    新規イベントを作成
                </h1>
            </div>

            {/* メインコンテンツ */}
            {/* 説明文 */}
            <div className="mt-10 ml-15 mb-5">
                <p className="text-black text-xl">
                    以下の日程がAIによって提案されました。
                </p>
                <p className="text-black text-xl">
                    イベントを作成したい日程を選択してください。
                </p>
            </div>

            <div className="flex justify-center py-8">
                <div className="w-4/5 max-w-5xl">
                    {/* 日程選択オプション */}
                    <div className="space-y-9 mb-8">
                        {suggestedDates.map((date) => (
                            <div
                                key={date.id}
                                onClick={() => handleDateSelect(date.id)}
                                className={`p-6 rounded-lg cursor-pointer transition-colors ${
                                    selectedDateId === date.id
                                        ? "bg-blue-100 border-2 border-blue-500"
                                        : "bg-gray-100 hover:bg-gray-200"
                                }`}
                            >
                                <p className="text-black font-bold text-center text-xl">
                                    {date.date} {date.timeRange}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* アクションボタン */}
                    <div className="flex justify-between space-x-6 mt-15">
                        <button
                            onClick={handleViewOtherDates}
                            className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-bold hover:bg-blue-600 transition-colors"
                        >
                            他の日程を見る
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedDateId}
                            className={`px-8 py-3 rounded-lg text-lg font-bold transition-colors ${
                                selectedDateId
                                    ? "bg-blue-500 text-white hover:bg-blue-600"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                        >
                            決定
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
