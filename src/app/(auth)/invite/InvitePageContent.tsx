"use client";

import { useState } from "react";
import Link from "next/link";
import InviteCreateButton from "./InviteCreateButton";

type InvitePageContentProps = {
    groupId: string | null;
};

export default function InvitePageContent({ groupId }: InvitePageContentProps) {
    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSuccess = (token: string) => {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        setInviteUrl(`${origin}/invited?token=${token}`);
        setError(null);
    };

    const handleError = (error: string) => {
        setError(error);
        setInviteUrl(null);
    };

    const handleCopy = async () => {
        if (inviteUrl) {
            try {
                await navigator.clipboard.writeText(inviteUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error("Failed to copy:", err);
                setError("URLのコピーに失敗しました。手動でコピーしてください。");
            }
        }
    };

    return (
        <>
            {error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <svg
                            className="w-5 h-5 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-red-800 mb-1">
                            エラーが発生しました
                        </h3>
                        <p className="text-red-600">{error}</p>
                        <div className="mt-4">
                            <InviteCreateButton
                                groupId={groupId}
                                onSuccess={handleSuccess}
                                onError={handleError}
                            />
                        </div>
                    </div>
                </div>
            ) : inviteUrl ? (
                <div className="space-y-8">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-4 h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">
                                招待リンクが生成されました
                            </h2>
                        </div>
                        <p className="text-gray-600 ml-11">
                            以下のリンクを招待したい方に共有してください
                        </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-500 mb-2">
                                    招待URL
                                </p>
                                <p className="text-base text-gray-800 bg-white border border-gray-200 rounded-lg p-4 break-all font-mono">
                                    {inviteUrl}
                                </p>
                            </div>
                            <button
                                onClick={handleCopy}
                                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${copied
                                        ? "bg-green-500 text-white"
                                        : "bg-blue-500 hover:bg-blue-600 text-white"
                                    }`}
                            >
                                {copied ? (
                                    <>
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        コピー完了
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                            />
                                        </svg>
                                        コピー
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-start gap-3">
                        <Link
                            href="/group"
                            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                            グループ一覧に戻る
                        </Link>
                        <InviteCreateButton
                            groupId={groupId}
                            onSuccess={handleSuccess}
                            onError={handleError}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <svg
                            className="w-8 h-8 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                            />
                        </svg>
                    </div>
                    <p className="text-lg text-gray-600 font-medium mb-6">
                        招待リンクを作成してグループに招待しましょう
                    </p>
                    <InviteCreateButton
                        groupId={groupId}
                        onSuccess={handleSuccess}
                        onError={handleError}
                    />
                </div>
            )}
        </>
    );
}
