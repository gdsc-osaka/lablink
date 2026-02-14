
import { requireAuth } from "@/lib/auth/server-auth";
import CreateEventForm from "./CreateEventForm";

export default async function CreateEventPage() {
    await requireAuth();
    // サーバー側でユーザー一覧を取得
    // TODO: グループのユーザー一覧取得serviceができたらそちらを使う(とりあえずapi叩いておく)
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/users`, { cache: "no-store" });
    const users = res.ok ? await res.json() : [];
    return (
        <main className="min-h-screen bg-white">
            <div className="w-full mx-auto">
                <div className="flex w-full h-25 bg-gray-300">
                    <h1 className="text-4xl font-bold text-black py-8 ml-10">
                        新規イベントを作成
                    </h1>
                </div>
                <CreateEventForm users={users} />
            </div>
        </main>
    );
}
