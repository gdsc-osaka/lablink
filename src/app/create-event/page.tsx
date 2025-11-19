"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import type { EventTimeOfDay, EventDraft } from "@/domain/event";
import { useForm, SubmitHandler } from "react-hook-form";
import Fuse from "fuse.js";

const timeOfDayInputItems: {
    value: EventTimeOfDay;
    label: string;
}[] = [
    { value: "morning", label: "朝（8:00~12:00ごろ）" },
    { value: "noon", label: "昼（12:00~15:00ごろ）" },
    { value: "evening", label: "夕（15:00~18:00ごろ）" },
    { value: "night", label: "夜（18:00~22:00ごろ）" },
];

export default function CreateEventPage() {
    const router = useRouter();

    // useFormフックをコンポーネント内で呼び出す
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
    } = useForm<EventDraft>({
        defaultValues: {
            title: "",
            duration: "",
            timeOfDayCandidate: [],
            priorityParticipants: "",
            description: "",
        },
    });

    const [users, setUsers] = useState<
        Array<{ id: string; username: string; email: string }>
    >([]);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<typeof users>([]);
    const [selected, setSelected] = useState<typeof users>([]);

    const fuse = useMemo(() => {
        return new Fuse(users, {
            keys: ["username", "email"],
            threshold: 0.3,
        });
    }, [users]);

    useEffect(() => {
        // フェッチ: テスト用のユーザー一覧を取得
        fetch("/api/users")
            .then((r) => r.json())
            .then((data) => setUsers(data))
            .catch(() => setUsers([]));
    }, []);

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }
        const res = fuse
            .search(query)
            .map((r: Fuse.FuseResult<(typeof users)[number]>) => r.item);
        setResults(res);
    }, [query, fuse]);

    // 選択の変化をフォームの値に反映（カンマ区切り）
    useEffect(() => {
        const csv = selected.map((s) => s.email).join(",");
        setValue("priorityParticipants", csv);
    }, [selected, setValue]);

    // フォーム送信時の処理
    const onSubmit: SubmitHandler<EventDraft> = (data: EventDraft) => {
        console.log(data);

        //TODO: create-event のAPIへの送信処理を追加
        router.push("/ai-suggest");
    };

    return (
        <main className="min-h-screen bg-white">
            <div className="w-full mx-auto">
                <div className="flex w-full h-25 bg-gray-300">
                    <h1 className="text-4xl font-bold text-black py-8 ml-10">
                        新規イベントを作成
                    </h1>
                </div>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-6 px-15 mt-9"
                >
                    <div>
                        <label htmlFor="title" className="event-form-label">
                            タイトル
                        </label>
                        <input
                            type="text"
                            id="title"
                            {...register("title", {
                                required: "タイトルは必須です",
                            })}
                            placeholder="イベントのタイトル（例: 編入生歓迎タコパ会）"
                            className="event-form-input"
                        />
                        {errors.title && (
                            <p className="event-form-error">
                                {errors.title.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="duration" className="event-form-label">
                            所要時間
                        </label>
                        <input
                            type="text"
                            id="duration"
                            {...register("duration", {
                                required: "所要時間は必須です",
                            })}
                            placeholder="イベントの所要時間 (例: 30分、2時間)"
                            className="event-form-input"
                        />
                        {errors.duration && (
                            <p className="event-form-error">
                                {errors.duration.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="event-form-label">時間帯</label>
                        <div className="mt-2 space-y-2">
                            {timeOfDayInputItems.map((item) => (
                                <div
                                    key={item.value}
                                    className="flex items-center"
                                >
                                    <input
                                        type="checkbox"
                                        id={item.value}
                                        value={item.value}
                                        {...register("timeOfDayCandidate", {
                                            required:
                                                "時間帯を少なくとも1つ選択してください",
                                        })}
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
                        {errors.timeOfDayCandidate && (
                            <p className="event-form-error">
                                {errors.timeOfDayCandidate.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="userSearch"
                            className="event-form-label"
                        >
                            優先参加者を検索して追加
                        </label>
                        <input
                            id="userSearch"
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="ユーザー名やメールで検索"
                            className="event-form-input"
                        />

                        {/* 検索結果 */}
                        {results.length > 0 && (
                            <div className="mt-2 space-y-1 max-h-48 overflow-auto border rounded p-2 bg-white">
                                {results.map((u) => (
                                    <div
                                        key={u.id}
                                        className="flex items-center justify-between py-1"
                                    >
                                        <div>
                                            <div className="text-sm font-medium">
                                                {u.username}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {u.email}
                                            </div>
                                        </div>
                                        <div>
                                            <button
                                                type="button"
                                                className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-sm"
                                                onClick={() => {
                                                    // 重複を避けて追加
                                                    setSelected((prev) => {
                                                        if (
                                                            prev.find(
                                                                (p) =>
                                                                    p.id ===
                                                                    u.id,
                                                            )
                                                        )
                                                            return prev;
                                                        return [...prev, u];
                                                    });
                                                    setQuery("");
                                                }}
                                            >
                                                追加
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 選択済みチップ */}
                        {selected.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {selected.map((s) => (
                                    <div
                                        key={s.id}
                                        className="flex items-center bg-gray-200 px-3 py-1 rounded-full text-sm"
                                    >
                                        <span className="mr-2">
                                            {s.username}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelected((prev) =>
                                                    prev.filter(
                                                        (p) => p.id !== s.id,
                                                    ),
                                                )
                                            }
                                            className="text-xs text-gray-600 hover:text-gray-800"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 隠し input: react-hook-form と同期させる */}
                        <input
                            type="hidden"
                            {...register("priorityParticipants")}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            検索してユーザーを一人ずつ追加してください（任意）。
                        </p>
                    </div>

                    <div>
                        <label htmlFor="details" className="event-form-label">
                            イベントの詳細
                        </label>
                        <textarea
                            id="details"
                            rows={4}
                            {...register("description", {
                                required: "イベントの詳細は必須です",
                            })}
                            placeholder="新しく研究室配属された学部4年の学生の歓迎会としてたこ焼きパーティーをする外部進学した留学生のためにたこ焼きパーティーをする"
                            className="event-form-input"
                        ></textarea>
                        {errors.description && (
                            <p className="event-form-error">
                                {errors.description.message}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            AIのsuggestへ
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
