"use client";

import { useRouter } from "next/navigation";
import type { EventTimeOfDay } from "@/domain/event";
import { useForm, SubmitHandler } from "react-hook-form";

interface EventData {
    title: string;
    duration: string;
    timeOfDayCandidate: EventTimeOfDay[];
    description: string;
}

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
    } = useForm<EventData>({
        defaultValues: {
            title: "",
            duration: "",
            timeOfDayCandidate: [],
            description: "",
        },
    });

    // フォーム送信時の処理
    const onSubmit: SubmitHandler<EventData> = (data) => {
        console.log(data);
        
        // フォーム送信成功後、AI suggestページへ遷移
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
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-15 mt-9">
                    <div>
                        <label
                            htmlFor="title"
                            className="event-form-label"
                        >
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
                        <label
                            htmlFor="duration"
                            className="event-form-label"
                        >
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
                        <label className="event-form-label">
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
                                        value={item.value}
                                        {...register("timeOfDayCandidate", {
                                            required: "時間帯を少なくとも1つ選択してください",
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
                            htmlFor="details"
                            className="event-form-label"
                        >
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
};