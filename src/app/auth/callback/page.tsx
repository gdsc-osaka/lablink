"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/firebase/client";
import { doc, setDoc, Timestamp } from "firebase/firestore";

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
                const credential = GoogleAuthProvider.credential(id_token, access_token);
                const userCredential = await signInWithCredential(auth, credential);
                const user = userCredential.user;

                // 3. リフレッシュトークンがある場合、サーバー側で暗号化してFirestoreに保存
                if (refresh_token) {
                    setStatus("リフレッシュトークンを保存中...");

                    // サーバー側で暗号化
                    const encryptResponse = await fetch("/api/auth/save-refresh-token", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ refresh_token }),
                    });

                    if (!encryptResponse.ok) {
                        console.error("Failed to encrypt refresh token");
                    } else {
                        const { encrypted_refresh_token } = await encryptResponse.json();

                        // ユーザー基本情報を保存（トークン以外）
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

                        // 暗号化されたトークンをサブコレクションに保存
                        const tokenRef = doc(db, "users", user.uid, "private", "tokens");
                        await setDoc(tokenRef, {
                            google_refresh_token_encrypted: encrypted_refresh_token,
                            google_token_expires_at: Timestamp.now(),
                            updated_at: Timestamp.now(),
                        });

                        console.log(`Refresh token saved for user: ${user.uid} (${user.email})`);
                    }
                } else {
                    console.warn("No refresh token received. User may have already authorized.");
                }

                setStatus("ログイン成功！リダイレクト中...");

                // 4. ホームページにリダイレクト
                setTimeout(() => {
                    router.push("/");
                }, 1000);
            } catch (err) {
                console.error("OAuth callback error:", err);
                setStatus(`エラー: ${err instanceof Error ? err.message : "不明なエラー"}`);
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
                    <svg className="animate-spin h-10 w-10 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                <p className="text-lg text-gray-700">{status}</p>
            </div>
        </div>
    );
}
