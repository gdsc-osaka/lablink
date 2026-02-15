import { requireAuth } from "@/lib/auth/server-auth";
import CreateEventForm from "./CreateEventForm";

// テスト用の静的ユーザー一覧
// TODO: UserRepository.findAll() または UserGroupRepository.findUsersByGroupId() を実装したら置き換える
const MOCK_USERS = [
    { id: "1", username: "tanigaki kei", email: "tanigaki_kei@example.com" },
    { id: "2", username: "suyama souta", email: "suyama_souta@example.com" },
    { id: "3", username: "yoshida kazuya", email: "yoshida_kazuya@example.com" },
    { id: "4", username: "siomi ayari", email: "siomi_ayari@example.com" },
    { id: "5", username: "itaya kosuke", email: "itaya_kosuke@example.com" },
];

export default async function CreateEventPage() {
    await requireAuth();

    const users = MOCK_USERS;

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
