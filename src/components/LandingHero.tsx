"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function LandingHero() {
    const router = useRouter();

    const handleCTAClick = () => {
        router.push("/login");
    };

    return (
        <section className="pt-16 md:pt-18 pb-0">
            <div className="container mx-auto max-w-[1200px] px-6 md:px-8">
                <div className="flex flex-col items-center text-center space-y-6">
                    {/* タイトル */}
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                        Lablink
                    </h1>

                    {/* サブタイトル */}
                    <p className="mt-4 text-muted-foreground text-lg md:text-xl lg:text-2xl max-w-2xl">
                        スケジュール調整を半自動化
                    </p>

                    {/* CTA ボタン */}
                    <Button
                        onClick={handleCTAClick}
                        size="lg"
                        className="mt-4 px-12 py-7 text-lg md:text-xl lg:text-2xl"
                    >
                        lablinkを始める
                    </Button>
                </div>
            </div>
        </section>
    );
}
