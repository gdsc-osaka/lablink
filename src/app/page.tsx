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
        <div className="min-h-screen flex items-center justify-center bg-white">
            <main className="flex flex-col items-center gap-8 px-8 max-w-6xl w-full">
                {/* タイトル */}
                <h1 className="text-6xl font-bold text-center">Lablink</h1>

                {/* サブタイトル（日本語テキスト） */}
                <p className="text-2xl text-center text-gray-700">
                    スケジュール調整を半自動化
                </p>

                {/* カルーセル */}
                <FeatureCarousel />

                {/* ボタン */}
                <Button
                    onClick={handleButtonClick}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-3xl font-medium px-32 py-8 rounded-lg transition-colors duration-200"
                >
                    lablinkを始める
                </Button>
            </main>
        </div>
    );
}

// cloneした時にあった内容をコメントアウトしています↓↓↓

// import GroupInvitationScreen from "./invite/page"; // SignInFormをインポート
{
    /*
export default function Home() {
    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
                <GroupInvitationScreen></GroupInvitationScreen>
            </main>
        </div>
    );
}
*/
}
