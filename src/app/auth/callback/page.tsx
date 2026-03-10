"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/firebase/client";
import { Spinner } from "@/components/ui/spinner";
import { userRepo } from "@/infra/user/user-repo";
import { createNewUser } from "@/domain/user";
import { isSafeRedirectUrl } from "@/lib/url";

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
                router.push(`/signin?error=${encodeURIComponent(error)}`);
                return;
            }

            if (!code) {
                router.push("/signin?error=no_code");
                return;
            }

            // State の検証（Login CSRF 対策）
            const savedState = sessionStorage.getItem("oauth_state");
            if (!state || !savedState || state !== savedState) {
                console.error("OAuth state mismatch or missing");
                router.push("/signin?error=invalid_state");
                return;
            }

            exchangeAttempted.current = true;

            try {
                setStatus("トークンを取得中...");

                // 1. API Route経由でトークン交換と永続化（サーバー完結）
                const tokenResponse = await fetch("/api/auth/exchange-token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ code }),
                });

                if (!tokenResponse.ok) {
                    const errorData = await tokenResponse.json();
                    console.error("Token exchange failed:", errorData);
                    throw new Error("Failed to exchange authorization code");
                }

                const tokens = await tokenResponse.json();
                const { access_token, id_token } = tokens;

                if (!id_token) {
                    throw new Error(
                        "ID token not received from OAuth provider",
                    );
                }

                setStatus("Firebase にログイン中...");

                // 2. Firebase Auth にログイン（ID Token を使用）
                const credential = GoogleAuthProvider.credential(
                    id_token,
                    access_token,
                );
                const userCredential = await signInWithCredential(
                    auth,
                    credential,
                );
                const user = userCredential.user;

                setStatus("セッションを同期中...");

                // 2.5 リフレッシュトークンの永続化（Cookie -> DB）
                const syncResponse = await fetch(
                    "/api/auth/sync-google-token",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${await user.getIdToken()}`,
                        },
                    },
                );

                if (!syncResponse.ok) {
                    console.warn(
                        "Failed to sync refresh token, but ignoring to continue login flow",
                    );
                }

                // 3. ユーザー基本情報を保存（初回のみ）
                const existingUserResult = await userRepo.findById(user.uid);
                if (existingUserResult.isErr()) {
                    const newUserResult = createNewUser(user);
                    if (newUserResult.isOk()) {
                        await userRepo.create(newUserResult.value);
                    }
                }

                setStatus("ログイン成功！リダイレクト中...");

                // 4. ホームページまたは指定されたリダイレクト先に遷移
                // isMounted に関わらずリダイレクトは必ず実行する
                setTimeout(() => {
                    const redirectTo =
                        sessionStorage.getItem("oauth_redirect_to");
                    if (redirectTo && isSafeRedirectUrl(redirectTo)) {
                        router.push(redirectTo);
                    } else {
                        router.push("/group");
                    }
                    sessionStorage.removeItem("oauth_redirect_to");
                }, 1000);
            } catch (err) {
                console.error("OAuth callback error:", err);
                setStatus(
                    `エラー: ${err instanceof Error ? err.message : "不明なエラー"}`,
                );
                setTimeout(() => {
                    router.push("/signin?error=authentication_failed");
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
