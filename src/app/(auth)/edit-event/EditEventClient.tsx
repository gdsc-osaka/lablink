"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Event, type EventTimeOfDay, EventDraft } from "@/domain/event";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { convertEventToDraft } from "@/lib/event-to-draft";
import { useForm, SubmitHandler } from "react-hook-form";

const sampleEvents: Event[] = [
    {
        id: "101",
        title: "交流会",
        description:
            "新しく研究室配属された学部4年の学生の歓迎会としてたこ焼きパーティーをする",
        begin_at: new Date("2025-05-12T13:00:00Z"),
        end_at: new Date("2025-05-12T16:00:00Z"),
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        id: "102",
        title: "ミーティング",
        description: "外部進学した留学生のためにたこ焼きパーティーをする",
        begin_at: new Date("2025-05-23T11:00:00Z"),
        end_at: new Date("2025-05-23T12:00:00Z"),
        created_at: new Date(),
        updated_at: new Date(),
    },
];

const emptyDraft: EventDraft = {
    title: "",
    duration: "",
    timeOfDayCandidate: [],
    description: "",
};

const timeOfDayInputItems: {
    value: EventTimeOfDay;
    label: string;
}[] = [
    { value: "morning", label: "朝（8:00~12:00ごろ）" },
    { value: "noon", label: "昼（12:00~15:00ごろ）" },
    { value: "evening", label: "夕（15:00~18:00ごろ）" },
    { value: "night", label: "夜（18:00~22:00ごろ）" },
];

const timeOfDayHours: Record<EventTimeOfDay, number> = {
    morning: 8,
    noon: 12,
    evening: 15,
    night: 18,
};

function parseDurationToMinutes(duration: string): number {
    const hoursMatch = duration.match(/(\d+)時間/);
    const minutesMatch = duration.match(/(\d+)分/);
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    return hours * 60 + minutes;
}

function convertDraftToEvent(draft: EventDraft, original: Event): Event {
    const durationMinutes = parseDurationToMinutes(draft.duration);
    const firstTimeOfDay = draft.timeOfDayCandidate[0];
    const startHour = firstTimeOfDay
        ? timeOfDayHours[firstTimeOfDay]
        : original.begin_at.toDate().getHours();

    const beginDate = original.begin_at.toDate();
    beginDate.setHours(startHour, 0, 0, 0);
    const endDate = new Date(beginDate.getTime() + durationMinutes * 60 * 1000);

    return {
        ...original,
        title: draft.title,
        description: draft.description,
        begin_at: Timestamp.fromDate(beginDate),
        end_at: Timestamp.fromDate(endDate),
        updated_at: new Date(),
    };
}

const EditEventPage = () => {
    const searchParams = useSearchParams();
    const eventId = searchParams.get("id");

    const originalEvent = useMemo(
        () => sampleEvents.find((e) => e.id === eventId) ?? null,
        [eventId],
    );

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<EventDraft>({
        defaultValues: originalEvent
            ? convertEventToDraft(originalEvent)
            : emptyDraft,
    });

    // eventId が変わったときにフォームをリセットする
    const [syncedEventId, setSyncedEventId] = useState(eventId);
    if (syncedEventId !== eventId) {
        setSyncedEventId(eventId);
        reset(originalEvent ? convertEventToDraft(originalEvent) : emptyDraft);
    }

    const onSubmit: SubmitHandler<EventDraft> = (data) => {
        if (!originalEvent) return;
        const updatedEvent = convertDraftToEvent(data, originalEvent);
        console.log("Event Updated:", updatedEvent);
        // TODO: APIへの更新処理
    };

    // イベント削除をハンドルする関数
    const handleDelete = () => {
        if (confirm("このイベントを削除しますか？")) {
            console.log("Event Deleted:", eventId);
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
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-6 px-15 mt-9"
                >
                    <div>
                        <Label
                            htmlFor="title"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            タイトル
                        </Label>
                        <Input
                            type="text"
                            id="title"
                            placeholder="イベントのタイトル（例: 編入生歓迎タコパ会）"
                            className="mt-2 block w-full p-3 bg-white border border-gray-400 rounded-lg focus:outline-none focus:border-gray-400 text-black"
                            {...register("title", {
                                required: "タイトルは必須です",
                            })}
                        />
                        {errors.title && (
                            <p className="text-sm text-red-600 mt-2">
                                {errors.title.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label
                            htmlFor="duration"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            所要時間
                        </Label>
                        <Input
                            type="text"
                            id="duration"
                            placeholder="イベントの所要時間 (例: 30分、2時間)"
                            className="mt-2 block w-full p-3 bg-white border border-gray-400 rounded-lg focus:outline-none focus:border-gray-400 text-black"
                            {...register("duration", {
                                required: "所要時間は必須です",
                                validate: (value) =>
                                    (/^(\d+時間)?(\d+分)?$/.test(value) &&
                                        value.length > 0) ||
                                    "所要時間は「30分」「2時間」「2時間30分」の形式で入力してください",
                            })}
                        />
                        {errors.duration && (
                            <p className="text-sm text-red-600 mt-2">
                                {errors.duration.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label className="block text-sm font-medium text-black mb-1">
                            時間帯
                        </Label>
                        <div className="mt-2 space-y-2">
                            {timeOfDayInputItems.map((item) => (
                                <div
                                    key={item.value}
                                    className="flex items-center"
                                >
                                    <Input
                                        type="checkbox"
                                        id={item.value}
                                        value={item.value}
                                        {...register("timeOfDayCandidate", {
                                            validate: (value) =>
                                                (Array.isArray(value) &&
                                                    value.length > 0) ||
                                                "時間帯を少なくとも1つ選択してください",
                                        })}
                                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <Label
                                        htmlFor={item.value}
                                        className="text-black"
                                    >
                                        {item.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        {errors.timeOfDayCandidate && (
                            <p className="text-sm text-red-600 mt-2">
                                {errors.timeOfDayCandidate.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label
                            htmlFor="details"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            イベントの詳細
                        </Label>
                        <Textarea
                            id="details"
                            rows={4}
                            placeholder="新しく研究室配属された学部4年の学生の歓迎会としてたこ焼きパーティーをする外部進学した留学生のためにたこ焼きパーティーをする"
                            className="mt-2 block w-full p-3 bg-white border border-gray-400 rounded-lg focus:outline-none focus:border-gray-400 text-black"
                            {...register("description", {
                                required: "イベントの詳細は必須です",
                            })}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-600 mt-2">
                                {errors.description.message}
                            </p>
                        )}
                    </div>

                    {/* ボタンエリア */}
                    <div className="flex justify-between pt-6">
                        <Button
                            type="button"
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        >
                            イベントを削除
                        </Button>

                        <div className="flex items-center gap-3">
                            <Button
                                type="submit"
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                            >
                                保存
                            </Button>

                            <Link href="/ai-suggest">
                                <Button
                                    type="button"
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    AIのsuggestへ
                                </Button>
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </main>
    );
};

export default EditEventPage;
