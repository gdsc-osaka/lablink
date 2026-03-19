"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/client";
import { Spinner } from "@/components/ui/spinner";
import { isSafeRedirectUrl } from "@/lib/url";

/**
 * Google OAuth 認証後のコールバックページ
 * Google Calendarの権限取得などのフローで使用
 */
export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState("処理中...");
    const exchangeAttempted = useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            if (exchangeAttempted.current) {
                return;
            }

            const code = searchParams.get("code");
            const error = searchParams.get("error");
            const state = searchParams.get("state");

            // エラーハンドリング
            if (error) {
                console.error("OAuth error:", error);
                router.push(`/login?error=${encodeURIComponent(error)}`);
                return;
            }

            if (!code) {
                router.push("/login?error=no_code");
                return;
            }

            // State の検証（Login CSRF 対策）
            const savedState = sessionStorage.getItem("oauth_state");
            if (!state || !savedState || state !== savedState) {
                console.error("OAuth state mismatch or missing");
                sessionStorage.removeItem("oauth_state");
                router.push("/login?error=invalid_state");
                return;
            }

            exchangeAttempted.current = true;

            try {
                setStatus("ユーザー認証を確認中...");

                // Firebaseの認証状態を待機
                const user = await new Promise((resolve) => {
                    const unsubscribe = onAuthStateChanged(auth, (u) => {
                        unsubscribe();
                        resolve(u);
                    });
                });

                if (!user) {
                    throw new Error("User is not authenticated with Firebase");
                }

                setStatus("トークンを取得・保存中...");

                // 1. API Route経由でトークン交換と永続化（サーバー完結）
                const tokenResponse = await fetch("/api/auth/exchange-token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ code, state }),
                });

                if (!tokenResponse.ok) {
                    const errorData = await tokenResponse.json();
                    console.error("Token exchange failed:", errorData);
                    throw new Error("Failed to exchange authorization code");
                }

                setStatus("連携成功！リダイレクト中...");

                // ホームページまたは指定されたリダイレクト先に遷移
                setTimeout(() => {
                    const redirectTo =
                        sessionStorage.getItem("oauth_redirect_to");
                    if (redirectTo && isSafeRedirectUrl(redirectTo)) {
                        router.push(redirectTo);
                    } else {
                        router.push("/group");
                    }
                    sessionStorage.removeItem("oauth_redirect_to");
                    sessionStorage.removeItem("oauth_state");
                }, 1000);
            } catch (err) {
                console.error("OAuth callback error:", err);
                setStatus(
                    `エラー: ${err instanceof Error ? err.message : "不明なエラー"}`,
                );
                sessionStorage.removeItem("oauth_state");
                setTimeout(() => {
                    router.push("/login?error=authentication_failed");
                }, 2000);
            }
        };

        handleCallback();

        return () => {};
        // searchParams / router の参照変化で再実行されないよう deps は空
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="bg-white p-10 rounded-xl shadow-lg text-center max-w-md">
                <div className="mb-4">
                    <Spinner className="h-10 w-10 mx-auto text-blue-600" />
                </div>
                <p className="text-lg text-gray-700">{status}</p>
            </div>
        </div>
    );
}
