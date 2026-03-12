"use client";

import Head from "next/head";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { loginWithGoogle } from "./actions";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        setIsLoading(true);
        const redirectTo = searchParams.get("redirectTo");
        try {
            await loginWithGoogle(redirectTo);
        } catch (e) {
            // Next.js redirect throws an error, so we shouldn't unset isLoading here if it's redirecting
            console.error("Login Error", e);
            setIsLoading(false);
        }
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
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center justify-center w-full"
                    >
                        {isLoading ? (
                            <Spinner className="mr-2 h-4 w-4 text-white" />
                        ) : null}
                        Googleでログイン
                    </Button>
                </div>
            </div>
        </>
    );
}
