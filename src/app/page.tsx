"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import FeatureCarousel from "@/components/FeatureCarousel";

export default function Home() {
    const router = useRouter();

    const handleButtonClick = () => {
        router.push("/login");
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
            <div className="w-full max-w-4xl rounded-md border-2 bg-white px-8 py-12 shadow-lg">
                <div className="flex flex-col items-center gap-6">
                    {/* タイトル */}
                    <h1 className="text-4xl md:text-5xl font-bold text-center">
                        Lablink
                    </h1>

                    {/* サブタイトル（日本語テキスト） */}
                    <p className="text-lg md:text-xl text-center text-slate-600">
                        スケジュール調整を半自動化
                    </p>

                    {/* カルーセル */}
                    <div className="w-full">
                        <FeatureCarousel />
                    </div>

                    {/* ボタン */}
                    <Button onClick={handleButtonClick} className="btn-primary mt-4">
                        lablinkを始める
                    </Button>
                </div>
            </div>
        </main>
    );
}
