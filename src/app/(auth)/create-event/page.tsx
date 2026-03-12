import CreateEventForm from "./CreateEventForm";

// TODO: 実際のユーザー一覧取得に置き換える
const mockUsers = [
    { id: "1", username: "alice", email: "alice@example.com" },
    { id: "2", username: "bob", email: "bob@example.com" },
    { id: "3", username: "charlie", email: "charlie@example.com" },
    { id: "4", username: "daisuke", email: "daisuke@example.com" },
    { id: "5", username: "emily", email: "emily@example.com" },
];

interface Props {
    searchParams: Promise<{ groupId?: string }>;
}

export default async function CreateEventPage({ searchParams }: Props) {
    const { groupId } = await searchParams;

    if (!groupId) {
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
                            エラー: グループIDが指定されていません。正しいURLからアクセスしてください。
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
                <CreateEventForm groupId={groupId} users={mockUsers} />
            </div>
        </main>
    );
}
