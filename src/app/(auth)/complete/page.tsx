import Link from "next/link";
import { requireAuth } from "@/lib/auth/server-auth";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export default async function EventCompletePage() {
    await requireAuth();

    return (
        <div className="min-h-screen bg-white">
            {/* ヘッダー */}
            <div className="flex w-full h-25 bg-gray-300">
                <h1 className="text-4xl font-bold text-black py-8 ml-10">
                    イベント作成完了
                </h1>
            </div>

            {/* メインコンテンツ */}
            <div className="p-6">
                <div className="text-center">
                    <div className="mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon></Icon>
                        </div>
                        <h2 className="text-2xl font-bold text-black mb-2">
                            イベントが正常に作成されました
                        </h2>
                        <p className="text-gray-600">
                            選択された日程でイベントが作成されました。
                        </p>
                    </div>

                    <Button
                        asChild
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        <Link href="/">ホームに戻る</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
