"use client";

import Head from "next/head";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createAuthService } from "@/service/auth-service";
import { userRepo } from "@/infra/user/user-repo";
import { authRepo } from "@/infra/auth/auth-repo";
import { auth } from "@/firebase/client";
import { getIdToken } from "firebase/auth";
import { createAuthSession } from "@/lib/auth/server-auth";
import { isSafeRedirectUrl } from "@/lib/url";

const authService = createAuthService(userRepo, authRepo);

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSignIn = async () => {
        const result = await authService.signInWithGoogle();

        result.match(
            async () => {
                // Firebase Authの現在のユーザーからIDトークンを取得してセッションクッキーを作成
                const currentUser = auth.currentUser;
                if (currentUser) {
                    const idToken = await getIdToken(currentUser);
                    await createAuthSession(idToken);
                }

                // redirectToが指定されていればそのページへ、なければグループ作成ページへ
                const redirectTo = searchParams.get("redirectTo");

                if (isSafeRedirectUrl(redirectTo)) {
                    router.push(redirectTo!);
                } else {
                    router.push("/create-group");
                }
            },
            (error) => {
                console.error("Google認証に失敗しました:", error.message);
                alert("ログインに失敗しました。再度お試しください。");
            },
        );
    };

    return (
        <>
            <Head>
                <title>lablink - ログイン</title>
            </Head>
            <div className="font-sans flex justify-center items-center min-h-screen bg-gray-100 text-gray-800">
                <div className="bg-white p-10 rounded-xl shadow-lg text-center max-w-md w-11/12">
                    <h1 className="text-3xl font-bold text-gray-800 mb-5">
                        lablinkへようこそ
                    </h1>
                    <Label className="mb-8 leading-relaxed">
                        スケジュール管理を始めるにはログインしてください。
                    </Label>
                    <Button
                        onClick={handleSignIn}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center justify-center w-full"
                    >
                        Googleでログイン
                    </Button>
                </div>
            </div>
        </>
    );
}
