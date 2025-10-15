"use client";

import { useState } from "react";
import Link from "next/link";
import type { EventTimeOfDay } from "@/domain/event";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

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

const CreateEventPage = () => {
    // useStateに型を指定し、分割代入で変数を受け取る
    const [eventData, setEventData] = useState<EventData>({
        title: "",
        duration: "",
        timeOfDayCandidate: [],
        description: "",
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
        console.log("Form Submitted:", eventData);
        // ここでAPIへの送信処理などを行う
    };

    // React Hook Form の useForm フックを初期化
    // - フォームの型を { title, duration, description } に指定
    // - defaultValues で初期値を設定
    const form = useForm<{
        title: string;
        duration: string;
        description: string;
    }>({
        defaultValues: {
            title: "",
            duration: "",
            description: "",
        },
    });

    return (
        <main className="min-h-screen bg-white">
            <div className="w-full mx-auto">
                <div className="flex w-full h-25 bg-gray-300">
                    <h1 className="text-4xl font-bold text-black py-8 ml-10">
                        新規イベントを作成
                    </h1>
                </div>
                <Form {...form}>
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6 px-15 mt-9"
                    >
                        <div>
                            <Label
                                htmlFor="title"
                                className="block text-sm font-medium text-black mb-1"
                            >
                                タイトル
                            </Label>
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
                            <Label
                                htmlFor="duration"
                                className="block text-sm font-medium text-black mb-1"
                            >
                                所要時間
                            </Label>
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
                            <Label className="block text-sm font-medium text-black mb-1">
                                時間帯
                            </Label>
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
                                        <Label
                                            htmlFor={item.value}
                                            className="text-black"
                                        >
                                            {item.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
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
                                name="description"
                                rows={4}
                                value={eventData.description}
                                placeholder="新しく研究室配属された学部4年の学生の歓迎会としてたこ焼きパーティーをする外部進学した留学生のためにたこ焼きパーティーをする"
                                onChange={handleChange}
                                className="mt-2 block w-full p-3 bg-white border border-gray-400 rounded-lg focus:outline-none focus:border-gray-400 text-black"
                            ></Textarea>
                        </div>

                        <div className="flex justify-end">
                            <Link href="/ai-suggest">
                                <Button
                                    type="button"
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    AIのsuggestへ
                                </Button>
                            </Link>
                        </div>
                    </form>
                </Form>
            </div>
        </main>
    );
};

export default CreateEventPage;
