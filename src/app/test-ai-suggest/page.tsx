/**
 * ⚠️ このファイルは開発・テスト用です
 * 本番環境にデプロイする前に削除してください
 *
 * 用途: AI Suggest API の動作確認
 * 削除予定: 本番デプロイ前
 */

"use client";

import { useState, useContext, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { suggestSchedule, createTestGroupWithMembers } from "@/app/actions";
import { SuggestScheduleRequest } from "@/domain/ai-suggest";
import { AuthContext } from "@/provider/AuthProvider";

export default function TestAISuggestPage() {
    const { user } = useContext(AuthContext);
    const [result, setResult] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [groupId, setGroupId] = useState<string>("");

    // グループ作成用の状態
    const [groupName, setGroupName] = useState<string>("テストグループ");
    const [ownerUserId, setOwnerUserId] = useState<string>("");

    // AI Suggest テスト用の状態
    const [title, setTitle] = useState<string>("研究室たこ焼きパーティー");
    const [description, setDescription] = useState<string>(
        "平日の夕方に研究室メンバーでたこやきパーティをする。",
    );
    const [durationMinutes, setDurationMinutes] = useState<number>(120);
    const [timeSlot, setTimeSlot] = useState<
        "morning" | "noon" | "evening" | "night"
    >("evening");
    const [daysAhead, setDaysAhead] = useState<number>(7);
    const [includeAsRequired, setIncludeAsRequired] = useState<boolean>(true);

    // ユーザーIDを自動設定 & 既存グループを検索
    useEffect(() => {
        const loadUserGroups = async () => {
            if (user?.uid) {
                setOwnerUserId(user.uid);

                // 既存グループを検索
                try {
                    const { db } = await import("@/firebase/client");
                    const { collection, getDocs } = await import(
                        "firebase/firestore"
                    );

                    const groupsRef = collection(
                        db,
                        "users",
                        user.uid,
                        "groups",
                    );
                    const snapshot = await getDocs(groupsRef);

                    if (!snapshot.empty) {
                        // 最初のグループIDを自動設定
                        const firstGroupId = snapshot.docs[0].id;
                        setGroupId(firstGroupId);
                        setResult(
                            `✅ 既存のグループ (${firstGroupId}) を検出しました。そのまま使用するか、新しいグループを作成できます。\n`,
                        );
                    }
                } catch (error) {
                    console.error("Failed to load user groups:", error);
                }
            }
        };

        loadUserGroups();
    }, [user]);

    const createSoloGroup = async () => {
        if (!user) {
            setResult("❌ エラー: ログインしてください\n");
            return;
        }

        if (!ownerUserId.trim()) {
            setResult("❌ エラー: ユーザーIDが取得できませんでした\n");
            return;
        }

        setLoading(true);
        setResult("グループを作成中...\n");

        try {
            setResult((prev) => prev + `\nグループ名: ${groupName}\n`);
            setResult((prev) => prev + `オーナー: ${ownerUserId}\n`);
            setResult((prev) => prev + `メンバー: なし（オーナーのみ）\n\n`);

            const response = await createTestGroupWithMembers(
                groupName,
                ownerUserId,
                [], // メンバーなし
            );

            if (response.success && response.groupId) {
                setResult((prev) => prev + `\n${response.message}\n`);
                setResult(
                    (prev) => prev + `\nグループID: ${response.groupId}\n`,
                );
                setGroupId(response.groupId);
            } else {
                setResult((prev) => prev + `\nエラー: ${response.message}\n`);
            }
        } catch (error) {
            console.error("Create solo group error:", error);
            setResult(
                (prev) =>
                    prev +
                    `\n\n❌ エラー: ${error instanceof Error ? error.message : "不明なエラー"}\n`,
            );
        } finally {
            setLoading(false);
        }
    };

    const testSuggestSchedule = async () => {
        if (!groupId.trim()) {
            setResult(
                "❌ エラー: グループIDを入力してください（先にグループを作成するか、既存のグループIDを入力）\n",
            );
            return;
        }

        setLoading(true);
        setResult("スケジュール提案をリクエスト中...\n");

        try {
            // テスト用リクエスト
            const request: SuggestScheduleRequest = {
                groupId: groupId,
                description: description,
                requiredMemberIds:
                    includeAsRequired && user?.uid ? [user.uid] : [],
                durationMinutes: durationMinutes,
                timeSlot: timeSlot,
                dateRange: {
                    start: new Date().toISOString(),
                    end: new Date(
                        Date.now() + daysAhead * 24 * 60 * 60 * 1000,
                    ).toISOString(),
                },
            };

            setResult(
                (prev) =>
                    prev +
                    `\nリクエスト:\n${JSON.stringify(request, null, 2)}\n`,
            );
            setResult((prev) => prev + `\nServer Action を呼び出し中...\n`);

            const response = await suggestSchedule(request);

            setResult(
                (prev) =>
                    prev +
                    `\nレスポンス:\n${JSON.stringify(response, null, 2)}\n`,
            );

            if (response.success && response.suggestions.length > 0) {
                setResult(
                    (prev) =>
                        prev +
                        `\n\n${response.suggestions.length}件の提案を取得:\n`,
                );
                response.suggestions.forEach((suggestion, idx) => {
                    const startDate = new Date(suggestion.start).toLocaleString(
                        "ja-JP",
                        { timeZone: "Asia/Tokyo" },
                    );
                    const endDate = new Date(suggestion.end).toLocaleString(
                        "ja-JP",
                        { timeZone: "Asia/Tokyo" },
                    );
                    setResult(
                        (prev) =>
                            prev +
                            `\n${idx + 1}. ${startDate} 〜 ${endDate}\n   理由: ${suggestion.reason}\n`,
                    );
                });
            } else {
                setResult(
                    (prev) =>
                        prev +
                        `\n${response.message || "提案が見つかりませんでした"}\n`,
                );
            }
        } catch (error) {
            console.error("Test error:", error);
            setResult(
                (prev) =>
                    prev +
                    `\n\n❌ エラー: ${error instanceof Error ? error.message : "不明なエラー"}\n`,
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg
                            className="h-5 w-5 text-yellow-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            <strong> 開発・テスト用ページ</strong>
                            <br />
                            このページは本番環境にデプロイする前に削除してください。
                        </p>
                    </div>
                </div>
            </div>

            <h1 className="text-3xl font-bold mb-2">AI Suggest API テスト</h1>
            <p className="text-gray-600 mb-6">
                グループ作成 & スケジュール提案の動作確認
            </p>

            {/* デバッグ情報 */}
            {!user && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-400 rounded">
                    <p className="text-sm text-yellow-800">
                        <strong> ログインしていません</strong>
                        <br />
                        このページを使うには、先に{" "}
                        <a href="/signin" className="underline text-blue-600">
                            Google OAuth ログイン
                        </a>{" "}
                        を完了してください。
                    </p>
                </div>
            )}

            {/* ステップ1: グループ作成 */}
            <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h2 className="text-xl font-bold mb-4">
                    ステップ 1: テストグループを作成
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            グループ名
                        </label>
                        <Input
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="例: 研究室メンバー"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            ログイン中のユーザー
                        </label>
                        <Input
                            value={
                                user
                                    ? `${user.displayName || user.email} (${ownerUserId})`
                                    : "ログインしていません"
                            }
                            disabled
                            className="bg-gray-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {user
                                ? "自動的に取得されました"
                                : "先にGoogle OAuth でログインしてください"}
                        </p>
                    </div>

                    <Button
                        onClick={createSoloGroup}
                        disabled={loading || !user}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? "作成中..." : "自分だけのグループを作成"}
                    </Button>
                    {!user && (
                        <p className="text-sm text-red-600">
                            グループを作成するには、先にログインが必要です
                        </p>
                    )}
                </div>
            </div>

            {/* ステップ2: AI Suggest */}
            <div className="mb-8 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-6">AI スケジュール提案</h2>

                <div className="space-y-6">
                    {/* グループID（隠しフィールド） */}
                    <input type="hidden" value={groupId} />

                    {/* タイトル */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            タイトル
                        </label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="イベントのタイトル（例: 輪講人数調整ミーティング(仮)）"
                            disabled={loading}
                            className="w-full"
                        />
                    </div>

                    {/* 所要時間 */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            所要時間
                        </label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={durationMinutes}
                                onChange={(e) =>
                                    setDurationMinutes(Number(e.target.value))
                                }
                                min={30}
                                step={30}
                                disabled={loading}
                                className="w-24"
                            />
                            <span className="text-sm">分</span>
                        </div>
                    </div>

                    {/* 時間帯 */}
                    <div>
                        <label className="block text-sm font-medium mb-3">
                            時間帯
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="timeSlot"
                                    value="morning"
                                    checked={timeSlot === "morning"}
                                    onChange={(e) =>
                                        setTimeSlot(e.target.value as any)
                                    }
                                    disabled={loading}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">
                                    朝（8:00-12:00ごろ）
                                </span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="timeSlot"
                                    value="noon"
                                    checked={timeSlot === "noon"}
                                    onChange={(e) =>
                                        setTimeSlot(e.target.value as any)
                                    }
                                    disabled={loading}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">
                                    昼（12:00-16:00ごろ）
                                </span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="timeSlot"
                                    value="evening"
                                    checked={timeSlot === "evening"}
                                    onChange={(e) =>
                                        setTimeSlot(e.target.value as any)
                                    }
                                    disabled={loading}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">
                                    夕（16:00-19:00ごろ）
                                </span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="timeSlot"
                                    value="night"
                                    checked={timeSlot === "night"}
                                    onChange={(e) =>
                                        setTimeSlot(e.target.value as any)
                                    }
                                    disabled={loading}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">夜（19:00以降）</span>
                            </label>
                        </div>
                    </div>

                    {/* イベントの詳細 */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            イベントの詳細
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="新しく研究室配属された学部4年の学生の歓迎会としてたこ焼きパーティーをする"
                            disabled={loading}
                            className="w-full p-2 border rounded min-h-[100px] resize-y"
                        />
                    </div>

                    {/* 検索期間（デバッグ用） */}
                    <div className="border-t pt-4">
                        <label className="block text-sm font-medium mb-2 text-gray-500">
                            検索期間（日）- デバッグ用
                        </label>
                        <Input
                            type="number"
                            value={daysAhead}
                            onChange={(e) =>
                                setDaysAhead(Number(e.target.value))
                            }
                            min={1}
                            max={30}
                            disabled={loading}
                            className="w-32"
                        />
                    </div>

                    {/* 必須メンバー設定 */}
                    <div className="flex items-center gap-2 border-t pt-4">
                        <input
                            type="checkbox"
                            id="includeAsRequired"
                            checked={includeAsRequired}
                            onChange={(e) =>
                                setIncludeAsRequired(e.target.checked)
                            }
                            disabled={loading}
                            className="w-4 h-4"
                        />
                        <label
                            htmlFor="includeAsRequired"
                            className="text-sm font-medium text-gray-500"
                        >
                            自分を必須メンバーに含める（デバッグ用）
                        </label>
                    </div>

                    {/* AI Suggest ボタン */}
                    <Button
                        onClick={testSuggestSchedule}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="lg"
                    >
                        {loading ? "提案を作成中..." : "スケジュール提案を取得"}
                    </Button>
                </div>
            </div>

            {/* 結果表示 */}
            {result && (
                <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-sm overflow-auto max-h-[600px]">
                    <pre className="whitespace-pre-wrap">{result}</pre>
                </div>
            )}
        </div>
    );
}
