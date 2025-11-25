"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleSignIn = () => {
        setLoading(true);
        setError(null);

        // Google OAuth 2.0 認証URLを構築
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const redirectUri = `${window.location.origin}/auth/callback`;

        const scope = [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.readonly",
        ].join(" ");

        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.set("client_id", clientId || "");
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", scope);
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "consent");

        // Google OAuth ページにリダイレクト
        window.location.href = authUrl.toString();
    };

    return (
        <div className="font-sans flex justify-center items-center min-h-screen bg-gray-100 text-gray-800">
            <div className="bg-white p-10 rounded-xl shadow-lg text-center max-w-md w-11/12">
                <h1 className="text-3xl font-bold text-gray-800 mb-5">
                    Googleでログイン
                </h1>
                <Label className="mb-8 leading-relaxed block">
                    Googleアカウントでログインして、カレンダー情報へのアクセスを許可してください。
                </Label>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <Button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center justify-center w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span>ログイン中...</span>
                    ) : (
                        <span>Googleでログイン</span>
                    )}
                </Button>

                <div className="mt-4 text-sm text-gray-600">
                    <p>ログインすることで、以下を許可します：</p>
                    <ul className="mt-2 text-left list-disc list-inside">
                        <li>Googleカレンダーの読み取り</li>
                        <li>スケジュールの空き時間確認</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
