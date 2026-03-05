import { Suspense } from "react";
import { requireAuth } from "@/lib/auth/server-auth";
import InvitePageContent from "./InvitePageContent";

type PageProps = {
    searchParams?: Promise<{ groupId?: string }>;
};

export default async function InvitePage({ searchParams }: PageProps) {
    await requireAuth();

    const params = await searchParams;
    const groupId = params?.groupId || null;

    return (
        <main className="min-h-screen bg-white">
            <div className="w-full mx-auto">
                <div className="flex w-full h-25 bg-gray-300">
                    <h1 className="text-4xl font-bold text-black py-8 ml-10">
                        招待リンク
                    </h1>
                </div>
                <div className="flex flex-col w-full bg-white p-8 md:p-12">
                    <div className="max-w-3xl mx-auto w-full">
                        <Suspense
                            fallback={
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-lg text-gray-600 font-medium">
                                        読み込み中...
                                    </p>
                                </div>
                            }
                        >
                            <InvitePageContent groupId={groupId} />
                        </Suspense>
                    </div>
                </div>
            </div>
        </main>
    );
}
