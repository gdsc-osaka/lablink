"use client";

import { useState } from "react";
import Link from "next/link";
import { Event } from "@/domain/event";

const CreateEventPage = () => {
    // useStateに型を指定し、分割代入で変数を受け取る
    const [eventData, setEventData] = useState<Event>({
        id: "",
        title: "",
        description: "",
        begin_at: new Date() as any,
        end_at: new Date() as any,
        created_at: new Date(),
        updated_at: new Date(),
    });

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
        console.log("Form Submitted:", eventData);
        // ここでAPIへの送信処理などを行う
    };

    return (
        <main className="min-h-screen bg-white">
            <div className="w-full mx-auto">
                <div className="flex w-full h-25 bg-gray-300">
                    <h1 className="text-4xl font-bold text-black py-8 ml-10">
                        新規イベントを作成
                    </h1>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6 px-15 mt-9">
                    <div>
                        <label
                            htmlFor="title"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            イベントのタイトルを記入してください
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={eventData.title}
                            placeholder="ミーティング"
                            onChange={handleChange}
                            className="mt-2 block w-full p-3 bg-white border border-gray-400 rounded-lg focus:outline-none focus:border-gray-400 text-black"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="begin_at"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            イベント開始日時を記入してください
                        </label>
                        <input
                            type="datetime-local"
                            id="begin_at"
                            name="begin_at"
                            value={eventData.begin_at instanceof Date ? eventData.begin_at.toISOString().slice(0, 16) : new Date(eventData.begin_at.seconds * 1000).toISOString().slice(0, 16)}
                            onChange={handleChange}
                            className="mt-2 block w-full p-3 bg-white border border-gray-400 rounded-lg focus:outline-none focus:border-gray-400 text-black"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="end_at"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            イベント終了日時を記入してください
                        </label>
                        <input
                            type="datetime-local"
                            id="end_at"
                            name="end_at"
                            value={eventData.end_at instanceof Date ? eventData.end_at.toISOString().slice(0, 16) : new Date(eventData.end_at.seconds * 1000).toISOString().slice(0, 16)}
                            onChange={handleChange}
                            className="mt-2 block w-full p-3 bg-white border border-gray-400 rounded-lg focus:outline-none focus:border-gray-400 text-black"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="description"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            イベントの詳細を記入してください
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            value={eventData.description}
                            placeholder="新しく研究室配属された学部4年の学生の歓迎会としてたこ焼きパーティーをする外部進学した留学生のためにたこ焼きパーティーをする"
                            onChange={handleChange}
                            className="mt-2 block w-full p-3 bg-white border border-gray-400 rounded-lg focus:outline-none focus:border-gray-400 text-black"
                        ></textarea>
                    </div>

                    <div className="flex justify-end">
                        <Link href="/ai-suggest">
                            <button
                                type="button"
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
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

export default CreateEventPage;
