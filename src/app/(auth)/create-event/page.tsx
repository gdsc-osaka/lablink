import { requireAuth } from "@/lib/auth/server-auth";
import CreateEventForm from "./CreateEventForm";

// テスト用の静的ユーザー一覧
// TODO: UserRepository.findAll() または UserGroupRepository.findUsersByGroupId() を実装したら置き換える
const MOCK_USERS = [
    { id: "1", username: "tanigaki kei", email: "tanigaki_kei@example.com" },
    { id: "2", username: "suyama souta", email: "suyama_souta@example.com" },
    {
        id: "3",
        username: "yoshida kazuya",
        email: "yoshida_kazuya@example.com",
    },
    { id: "4", username: "siomi ayari", email: "siomi_ayari@example.com" },
    { id: "5", username: "itaya kosuke", email: "itaya_kosuke@example.com" },
];

export default async function CreateEventPage({
    searchParams,
}: {
    searchParams: Promise<{ groupId?: string; eventId?: string }>;
}) {
    await requireAuth();

    const { groupId, eventId } = await searchParams;
    const users = MOCK_USERS;

    // クエリパラメータが不足している場合のエラー表示
    if (!groupId || !eventId) {
        return (
            <main className="min-h-screen bg-white">
                <div className="w-full mx-auto">
                    <div className="flex w-full h-25 bg-gray-300">
                        <h1 className="text-4xl font-bold text-black py-8 ml-10">
                            新規イベントを作成
                        </h1>
                    </div>
                    <div className="p-8">
                        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                            エラー:
                            グループIDまたはイベントIDが指定されていません。
                            正しいURLからアクセスしてください。
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white">
            <div className="w-full mx-auto">
                <div className="flex w-full h-25 bg-gray-300">
                    <h1 className="text-4xl font-bold text-black py-8 ml-10">
                        新規イベントを作成
                    </h1>
                </div>
                <CreateEventForm
                    users={users}
                    groupId={groupId}
                    eventId={eventId}
                />
            </div>
        </main>
    );
}
