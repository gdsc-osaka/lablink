"use client";

import { useState } from "react";
import Link from "next/link";

interface EventData {
    title: string;
    duration: string;
    timezone: string;
    details: string;
}

const CreateEventPage = () => {
    // useStateに型を指定し、分割代入で変数を受け取る
    const [eventData, setEventData] = useState<EventData>({
        title: "",
        duration: "",
        timezone: "",
        details: "",
    });

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
                            htmlFor="duration"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            イベントの所要時間を記入してください
                        </label>
                        <input
                            type="text"
                            id="duration"
                            name="duration"
                            value={eventData.duration}
                            placeholder="30分、2時間"
                            onChange={handleChange}
                            className="mt-2 block w-full p-3 bg-white border border-gray-400 rounded-lg focus:outline-none focus:border-gray-400 text-black"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="timezone"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            イベントの時間帯を記入してください
                        </label>
                        <input
                            type="text"
                            id="timezone"
                            name="timezone"
                            value={eventData.timezone}
                            placeholder="朝、昼、夕、夜"
                            onChange={handleChange}
                            className="mt-2 block w-full p-3 bg-white border border-gray-400 rounded-lg focus:outline-none focus:border-gray-400 text-black"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="details"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            イベントの詳細を記入してください
                        </label>
                        <textarea
                            id="details"
                            name="details"
                            rows={4}
                            value={eventData.details}
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
