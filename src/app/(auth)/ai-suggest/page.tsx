"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatToJST } from "@/lib/date";
import { createEventAction } from "@/app/(auth)/create-event/actions";
import {
    ScheduleSuggestion,
    ScheduleSuggestionSection,
} from "@/domain/schedule-suggestion";

interface EventSession {
    groupId: string;
    draft: { title: string; description: string };
    sections: ScheduleSuggestionSection[];
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
            const sections = normalizeSuggestionSections(parsed);
            if (!isValidSession(parsed) || !sections) {
                router.replace("/group");
                return;
            }
            setSession({ ...parsed, sections });
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

    const suggestions = session.sections.flatMap(
        (section) => section.suggestions,
    );
    const getSuggestionIndex = (
        sectionIndex: number,
        suggestionIndex: number,
    ): number =>
        session.sections
            .slice(0, sectionIndex)
            .reduce((sum, section) => sum + section.suggestions.length, 0) +
        suggestionIndex;

    if (suggestions.length === 0) {
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
            const suggestion = suggestions[selectedIndex];
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
        } catch (err) {
            console.error("Failed to confirm event:", err);
            setError("イベントの作成中にエラーが発生しました");
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
                    <div className="space-y-10 mb-8">
                        {session.sections.map((section, sectionIndex) => (
                            <section key={section.kind} className="space-y-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-black">
                                        {section.title}
                                    </h2>
                                    <p className="text-gray-600 mt-1">
                                        {section.description}
                                    </p>
                                </div>
                                {section.suggestions.length === 0 ? (
                                    <p className="text-gray-500">
                                        この条件に合う候補はありません。
                                    </p>
                                ) : (
                                    <div className="space-y-5">
                                        {section.suggestions.map(
                                            (s, suggestionIndex) => {
                                                const idx = getSuggestionIndex(
                                                    sectionIndex,
                                                    suggestionIndex,
                                                );
                                                const start = new Date(s.start);
                                                const end = new Date(s.end);
                                                const dateStr = formatToJST(
                                                    start,
                                                    "yyyy/MM/dd",
                                                );
                                                const startTime = formatToJST(
                                                    start,
                                                    "HH:mm",
                                                );
                                                const endTime = formatToJST(
                                                    end,
                                                    "HH:mm",
                                                );

                                                return (
                                                    <div
                                                        key={`${s.start}-${s.end}`}
                                                        role="button"
                                                        tabIndex={0}
                                                        aria-pressed={
                                                            selectedIndex ===
                                                            idx
                                                        }
                                                        onClick={() =>
                                                            setSelectedIndex(
                                                                idx,
                                                            )
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                    "Enter" ||
                                                                e.key === " "
                                                            ) {
                                                                e.preventDefault();
                                                                setSelectedIndex(
                                                                    idx,
                                                                );
                                                            }
                                                        }}
                                                        className={`p-6 rounded-lg cursor-pointer transition-colors ${
                                                            selectedIndex ===
                                                            idx
                                                                ? "bg-blue-100 border-2 border-blue-500"
                                                                : "bg-gray-100 hover:bg-gray-200"
                                                        }`}
                                                    >
                                                        <p className="text-black font-bold text-center text-xl">
                                                            {dateStr}{" "}
                                                            {startTime}～
                                                            {endTime}
                                                        </p>
                                                        <p className="text-gray-600 text-sm text-center mt-2">
                                                            {s.reason}
                                                        </p>
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                )}
                            </section>
                        ))}
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

function normalizeSuggestionSections(
    value: unknown,
): ScheduleSuggestionSection[] | null {
    if (!isObject(value)) {
        return null;
    }

    if (Array.isArray(value.sections) && value.sections.every(isSection)) {
        return value.sections;
    }

    if (
        Array.isArray(value.suggestions) &&
        value.suggestions.every(isSuggestion)
    ) {
        return [
            {
                kind: "preferred",
                title: "希望時間帯の候補",
                description: "入力内容と選択した時間帯に沿った候補です。",
                suggestions: value.suggestions,
            },
        ];
    }

    return null;
}

function isSection(value: unknown): value is ScheduleSuggestionSection {
    return (
        isObject(value) &&
        (value.kind === "preferred" || value.kind === "fallback") &&
        typeof value.title === "string" &&
        typeof value.description === "string" &&
        Array.isArray(value.suggestions) &&
        value.suggestions.every(isSuggestion)
    );
}

function isSuggestion(value: unknown): value is ScheduleSuggestion {
    return (
        isObject(value) &&
        isParseableDateString(value.start) &&
        isParseableDateString(value.end) &&
        typeof value.reason === "string"
    );
}

function isValidSession(value: unknown): value is EventSession {
    return (
        isObject(value) &&
        typeof value.groupId === "string" &&
        value.groupId.length > 0 &&
        isDraft(value.draft)
    );
}

function isDraft(
    value: unknown,
): value is { title: string; description: string } {
    return (
        isObject(value) &&
        typeof value.title === "string" &&
        typeof value.description === "string"
    );
}

function isParseableDateString(value: unknown): value is string {
    return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}
