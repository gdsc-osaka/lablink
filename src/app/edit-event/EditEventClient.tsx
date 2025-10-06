"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Event, type EventTimeOfDay, EventDraft } from "@/domain/event";
import { Timestamp } from "firebase/firestore";
import { convertEventToDraft } from "@/lib/event-to-draft";

const timeOfDayInputItems: {
    value: EventTimeOfDay;
    label: string;
}[] = [
    { value: "morning", label: "朝（8:00~12:00ごろ）" },
    { value: "noon", label: "昼（12:00~15:00ごろ）" },
    { value: "evening", label: "夕（15:00~18:00ごろ）" },
    { value: "night", label: "夜（18:00~22:00ごろ）" },
];

const EditEventPage = () => {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");

    // フォーム用のイベントデータを管理するstate
    const [eventData, setEventData] = useState<EventDraft>({
        title: "",
        duration: "",
        timeOfDayCandidate: [],
        description: "",
    });

  // 元のEventデータを管理するstate
  const [originalEvent, setOriginalEvent] = useState<Event | null>(null);

  // イベントデータを取得する関数
  useEffect(() => {
    if (eventId) {
      // サンプルデータ（実際のアプリではAPIから取得）
      const sampleEvents: Event[] = [
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

            const event = sampleEvents.find((e) => e.id === eventId);
            if (event) {
                setOriginalEvent(event);
                // EventからEventDraftに変換（計算された値を使用）
                const draft = convertEventToDraft(event);
                setEventData(draft);
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

    // チェックボックスの変更をハンドルする関数
    const handleCheckboxChange = (value: EventTimeOfDay) => {
        setEventData((prevData) => ({
            ...prevData,
            timeOfDayCandidate: prevData.timeOfDayCandidate.includes(value)
                ? prevData.timeOfDayCandidate.filter((item) => item !== value)
                : [...prevData.timeOfDayCandidate, value],
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
      console.log("Event Deleted:", originalEvent?.id);
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
                {/* フォーム */}
                <form onSubmit={handleSubmit} className="space-y-6 px-15 mt-9">
                    <div>
                        <label
                            htmlFor="title"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            タイトル
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={eventData.title}
                            placeholder="イベントのタイトル（例: 編入生歓迎タコパ会）"
                            onChange={handleChange}
                            className="mt-2 block w-full p-3 bg-white border border-gray-400 rounded-lg focus:outline-none focus:border-gray-400 text-black"
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
                            placeholder="イベントの所要時間 (例: 30分、2時間)"
                            onChange={handleChange}
                            className="mt-2 block w-full p-3 bg-white border border-gray-400 rounded-lg focus:outline-none focus:border-gray-400 text-black"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-black mb-1">
                            時間帯
                        </label>
                        <div className="mt-2 space-y-2">
                            {timeOfDayInputItems.map((item) => (
                                <div
                                    key={item.value}
                                    className="flex items-center"
                                >
                                    <input
                                        type="checkbox"
                                        id={item.value}
                                        checked={eventData.timeOfDayCandidate.includes(
                                            item.value,
                                        )}
                                        onChange={() =>
                                            handleCheckboxChange(item.value)
                                        }
                                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label
                                        htmlFor={item.value}
                                        className="text-black"
                                    >
                                        {item.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="details"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            イベントの詳細
                        </label>
                        <textarea
                            id="details"
                            name="description"
                            rows={4}
                            value={eventData.description}
                            placeholder="新しく研究室配属された学部4年の学生の歓迎会としてたこ焼きパーティーをする外部進学した留学生のためにたこ焼きパーティーをする"
                            onChange={handleChange}
                            className="mt-2 block w-full p-3 bg-white border border-gray-400 rounded-lg focus:outline-none focus:border-gray-400 text-black"
                        />
                    </div>

                    {/* ボタンエリア */}
                    <div className="flex justify-between pt-6">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        >
                            イベントを削除
                        </button>

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
            />
          </div>

          {/* ボタンエリア */}
          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              イベントを削除
            </button>

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

export default EditEventPage;
