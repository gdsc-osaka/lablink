"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/firebase/client";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { Spinner } from "@/components/ui/spinner";
import { saveRefreshToken } from "@/app/actions";

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState("処理中...");

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get("code");
            const error = searchParams.get("error");

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

            try {
                setStatus("トークンを取得中...");

                // 1. API Route経由でトークン交換のみ（client_secretはサーバー側で使用）
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
                const { access_token, refresh_token, id_token } = tokens;

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

                // 3. ユーザー基本情報を保存（トークン以外）
                const userRef = doc(db, "users", user.uid);
                await setDoc(
                    userRef,
                    {
                        email: user.email,
                        updated_at: Timestamp.now(),
                        created_at: Timestamp.now(),
                    },
                    { merge: true },
                );

                // 4. リフレッシュトークンがある場合、Server Action で暗号化してFirestoreに保存
                if (refresh_token) {
                    setStatus("リフレッシュトークンを保存中...");

                    // Server Action を呼び出し（Cookie ベース認証）
                    const result = await saveRefreshToken(refresh_token);

                    if (!result.success) {
                        console.error(
                            "Failed to save refresh token:",
                            result.message,
                        );
                    }
                }

                setStatus("ログイン成功！リダイレクト中...");

                // 5. ホームページにリダイレクト
                setTimeout(() => {
                    router.push("/");
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
    }, [searchParams, router]);

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
