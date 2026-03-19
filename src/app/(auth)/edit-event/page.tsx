import { requireAuth } from "@/lib/auth/server-auth";
import { firestoreEventAdminRepository } from "@/infra/event/event-admin-repo";
import EditEventClient from "./EditEventClient";

interface Props {
    searchParams: Promise<{ id?: string; groupId?: string }>;
}

export default async function EditEventPage({ searchParams }: Props) {
    await requireAuth();
    const { id, groupId } = await searchParams;

    const errorLayout = (message: string) => (
        <main className="min-h-screen bg-white">
            <div className="w-full mx-auto">
                <div className="flex w-full h-25 bg-gray-300">
                    <h1 className="text-4xl font-bold text-black py-8 ml-10">
                        イベントを編集
                    </h1>
                </div>
                <div className="p-8">
                    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {message}
                    </div>
                </div>
            </div>
        </main>
    );

    if (!id || !groupId) {
        return errorLayout(
            "エラー: イベントIDまたはグループIDが指定されていません。",
        );
    }

    const eventResult =
        await firestoreEventAdminRepository.getNewEventByGroupAndEventId(
            groupId,
            id,
        );

    if (eventResult.isErr()) {
        return errorLayout(
            "イベントの取得に失敗しました。存在しないか、アクセス権限がありません。",
        );
    }

    return <EditEventClient event={eventResult.value} groupId={groupId} />;
}
