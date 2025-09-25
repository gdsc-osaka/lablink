"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Event } from "@/domain/event";

const EditEventPage = () => {
    const searchParams = useSearchParams();
    const eventId = searchParams.get("id");

    // 既存のイベントデータを管理するstate
    const [eventData, setEventData] = useState<Event>({
        id: "",
        title: "",
        description: "",
        begin_at: new Date() as any,
        end_at: new Date() as any,
        created_at: new Date(),
        updated_at: new Date(),
    });

    // イベントデータを取得する関数（実際のAPIから取得する想定）
    useEffect(() => {
        if (eventId) {
            // サンプルデータ（実際のアプリではAPIから取得）
            const sampleEvents: Event[] = [
                {
                    id: "101",
                    title: "交流会",
                    description: "新しく研究室配属された学部4年の学生の歓迎会としてたこ焼きパーティーをする",
                    begin_at: new Date("2025-05-12T13:00:00Z") as any,
                    end_at: new Date("2025-05-12T16:00:00Z") as any,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: "102",
                    title: "ミーティング",
                    description: "外部進学した留学生のためにたこ焼きパーティーをする",
                    begin_at: new Date("2025-05-23T11:00:00Z") as any,
                    end_at: new Date("2025-05-23T12:00:00Z") as any,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];

            const event = sampleEvents.find((e) => e.id === eventId);
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
            [name]: name === 'begin_at' || name === 'end_at' ? new Date(value) as any : value,
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
                            htmlFor="begin_at"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            開始日時
                        </label>
                        <input
                            type="datetime-local"
                            id="begin_at"
                            name="begin_at"
                            value={eventData.begin_at instanceof Date ? eventData.begin_at.toISOString().slice(0, 16) : new Date(eventData.begin_at.seconds * 1000).toISOString().slice(0, 16)}
                            onChange={handleChange}
                            className="mt-2 block w-full p-3 bg-white border border-gray-400 rounded-lg focus:outline-none focus:border-blue-500 text-black"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="end_at"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            終了日時
                        </label>
                        <input
                            type="datetime-local"
                            id="end_at"
                            name="end_at"
                            value={eventData.end_at instanceof Date ? eventData.end_at.toISOString().slice(0, 16) : new Date(eventData.end_at.seconds * 1000).toISOString().slice(0, 16)}
                            onChange={handleChange}
                            className="mt-2 block w-full p-3 bg-white border border-gray-400 rounded-lg focus:outline-none focus:border-blue-500 text-black"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="description"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            詳細
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            value={eventData.description}
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
