"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatToJST } from "@/lib/date";
import { createEventAction } from "@/app/(auth)/create-event/actions";

interface EventSession {
    groupId: string;
    draft: { title: string; description: string };
    suggestions: { start: string; end: string; reason: string }[];
}

const SESSION_KEY = "lablink_event_session";

export default function AISuggestPage() {
    const router = useRouter();
    const [session, setSession] = useState<EventSession | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            if (!raw) {
                router.replace("/group");
                return;
            }
            const parsed = JSON.parse(raw) as EventSession;
            if (
                !parsed.groupId ||
                !parsed.draft ||
                !Array.isArray(parsed.suggestions)
            ) {
                router.replace("/group");
                return;
            }
            setSession(parsed);
        } catch {
            router.replace("/group");
        }
    }, [router]);

    if (!session) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-gray-500">読み込み中...</p>
            </div>
        );
    }

    if (session.suggestions.length === 0) {
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
                        <Button
                            onClick={() => router.push("/")}
                            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                        >
                            ホームに戻る
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const handleConfirm = async () => {
        if (selectedIndex === null) return;
        setError(null);
        setIsConfirming(true);
        try {
            const suggestion = session.suggestions[selectedIndex];
            const result = await createEventAction(session.groupId, {
                title: session.draft.title,
                description: session.draft.description,
                begin_at: new Date(suggestion.start),
                end_at: new Date(suggestion.end),
            });
            if (result.success) {
                sessionStorage.removeItem(SESSION_KEY);
                router.push("/complete");
            } else {
                setError(result.error);
            }
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* ヘッダー */}
            <div className="flex w-full h-25 bg-gray-300">
                <h1 className="text-4xl font-bold text-black py-8 ml-10">
                    新規イベントを作成
                </h1>
            </div>

            {/* メインコンテンツ */}
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
                    <div className="space-y-9 mb-8">
                        {session.suggestions.map((s, idx) => {
                            const start = new Date(s.start);
                            const end = new Date(s.end);
                            const dateStr = formatToJST(start, "yyyy/MM/dd");
                            const startTime = formatToJST(start, "HH:mm");
                            const endTime = formatToJST(end, "HH:mm");

                            return (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedIndex(idx)}
                                    className={`p-6 rounded-lg cursor-pointer transition-colors ${
                                        selectedIndex === idx
                                            ? "bg-blue-100 border-2 border-blue-500"
                                            : "bg-gray-100 hover:bg-gray-200"
                                    }`}
                                >
                                    <p className="text-black font-bold text-center text-xl">
                                        {dateStr} {startTime}～{endTime}
                                    </p>
                                    <p className="text-gray-600 text-sm text-center mt-2">
                                        {s.reason}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {error && (
                        <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end mt-15">
                        <Button
                            onClick={handleConfirm}
                            disabled={selectedIndex === null || isConfirming}
                            className={`px-8 py-3 rounded-lg text-lg font-bold transition-colors ${
                                selectedIndex !== null && !isConfirming
                                    ? "bg-blue-500 text-white hover:bg-blue-600"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                        >
                            {isConfirming ? "作成中..." : "決定"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
