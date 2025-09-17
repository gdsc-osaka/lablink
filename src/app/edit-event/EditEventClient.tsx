"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface EventData {
    id: number;
    title: string;
    duration: string;
    timezone: string;
    details: string;
}

const EditEventPage = () => {
    const searchParams = useSearchParams();
    const eventId = searchParams.get("id");

    // 既存のイベントデータを管理するstate
    const [eventData, setEventData] = useState<EventData>({
        id: 0,
        title: "",
        duration: "",
        timezone: "",
        details: "",
    });

    // イベントデータを取得する関数（実際のAPIから取得する想定）
    useEffect(() => {
        if (eventId) {
            // サンプルデータ（実際のアプリではAPIから取得）
            const sampleEvents: EventData[] = [
                {
                    id: 101,
                    title: "交流会",
                    duration: "3時間",
                    timezone: "昼 : 12:00 ~ 16:00",
                    details: "",
                },
                {
                    id: 102,
                    title: "ミーティング",
                    duration: "1時間",
                    timezone: "昼 : 11:00 ~ 12:00",
                    details: "",
                },
            ];

            const event = sampleEvents.find((e) => e.id === parseInt(eventId));
            if (event) {
                setEventData(event);
            }
        }
    }, [eventId]);

    // 入力値の変更をハンドルする関数
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setEventData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    // フォーム送信をハンドルする関数
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("Event Updated:", eventData);
        // ここでAPIへの更新処理などを行う
    };

    // イベント削除をハンドルする関数
    const handleDelete = () => {
        if (confirm("このイベントを削除しますか？")) {
            console.log("Event Deleted:", eventData.id);
            // ここでAPIへの削除処理などを行う
            // 削除後はグループページに戻る
            window.location.href = "/group";
        }
    };

    return (
        <main className="min-h-screen bg-white">
            <div className="w-full mx-auto">
                {/* ヘッダーエリア */}
                <div className="w-full h-25 bg-gray-300">
                    <h1 className="text-4xl font-bold text-black py-8 ml-10">
                        イベントを編集
                    </h1>
                </div>

                {/* 説明文 */}
                <div className="px-15 mt-6">
                    <p className="text-gray-600">
                        編集する項目を選択して、編集してください
                    </p>
                </div>

                {/* フォーム */}
                <form onSubmit={handleSubmit} className="space-y-6 px-15 mt-9">
                    <div>
                        <label
                            htmlFor="title"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            イベントタイトル
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={eventData.title}
                            onChange={handleChange}
                            className="mt-2 block w-full p-3 bg-white border border-gray-400 rounded-lg focus:outline-none focus:border-blue-500 text-black"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="duration"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            所要時間
                        </label>
                        <input
                            type="text"
                            id="duration"
                            name="duration"
                            value={eventData.duration}
                            onChange={handleChange}
                            className="mt-2 block w-full p-3 bg-white border border-blue-500 rounded-lg focus:outline-none focus:border-blue-500 text-black"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="timezone"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            時間帯
                        </label>
                        <input
                            type="text"
                            id="timezone"
                            name="timezone"
                            value={eventData.timezone}
                            onChange={handleChange}
                            className="mt-2 block w-full p-3 bg-white border border-gray-400 rounded-lg focus:outline-none focus:border-blue-500 text-black"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="details"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            詳細
                        </label>
                        <input
                            type="text"
                            id="details"
                            name="details"
                            value={eventData.details}
                            onChange={handleChange}
                            className="mt-2 block w-full p-3 bg-white border border-gray-400 rounded-lg focus:outline-none focus:border-blue-500 text-black"
                        />
                    </div>

                    {/* ボタンエリア */}
                    <div className="flex justify-between pt-6">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
                        >
                            イベントを削除
                        </button>

                        <Link href="/ai-suggest">
                            <button
                                type="button"
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                            >
                                AIのsuggestへ
                            </button>
                        </Link>
                    </div>
                </form>
            </div>
        </main>
    );
};

export default EditEventPage;
