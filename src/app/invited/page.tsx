import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createInvitationService } from "@/service/invitation-service";
import { invitationRepo } from "@/infra/invitation/invitation-repo";
import { firestoreGroupRepository } from "@/infra/group/group-repo";
import { firestoreUserGroupRepository } from "@/infra/group/user-group-repository";
import { authAdmin } from "@/firebase/admin";
import { cookies } from "next/headers";
import { InvitationButtons } from "./InvitationButtons";

interface PageProps {
    searchParams: Promise<{ token?: string }>;
}

async function GroupInvitationScreenContent({
    searchParams,
}: {
    searchParams: { token?: string };
}) {
    const token = searchParams.token;

    if (!token) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <Card className="w-[500px] bg-gray-200">
                    <CardHeader className="items-center justify-center text-center">
                        <CardTitle className="text-2xl font-normal text-red-600">
                            招待リンクが無効です
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full"
                            asChild
                        >
                            <Link href="/">ホームに戻る</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 認証情報の取得
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    let userId: string | null = null;
    if (sessionCookie) {
        try {
            const decodedClaims = await authAdmin.verifySessionCookie(
                sessionCookie,
                true,
            );
            userId = decodedClaims.uid;
        } catch (error) {
            console.error("Session verification failed:", error);
        }
    }

    if (!userId) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <Card className="w-[500px] bg-gray-200">
                    <CardHeader className="items-center justify-center text-center">
                        <CardTitle className="text-2xl font-normal text-red-600">
                            ログインが必要です
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full"
                            asChild
                        >
                            <Link href="/login">ログインする</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // グループ情報の取得
    const invitationService = createInvitationService(
        invitationRepo,
        firestoreGroupRepository,
        firestoreUserGroupRepository,
    );

    const result = await invitationService.getGroupByToken(token);

    const groupOrError = result.match(
        (group) => ({ group, error: null }),
        (err) => ({ group: null, error: err.message }),
    );

    if (groupOrError.error || !groupOrError.group) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <Card className="w-[500px] bg-gray-200">
                    <CardHeader className="items-center justify-center text-center">
                        <CardTitle className="text-2xl font-normal text-red-600">
                            {groupOrError.error}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full"
                            asChild
                        >
                            <Link href="/">ホームに戻る</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-white">
            <Card className="w-[500px] bg-gray-200">
                <CardHeader className="items-center justify-center text-center">
                    <CardTitle className="text-2xl font-normal text-gray-800">
                        「{groupOrError.group.name}」 に招待されています
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <InvitationButtons token={token} userId={userId} />
                </CardContent>
            </Card>
        </div>
    );
}

export default async function GroupInvitationScreen({ searchParams }: PageProps) {
    const params = await searchParams;
    
    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center min-h-screen bg-white">
                    <p className="text-xl text-gray-600">読み込み中...</p>
                </div>
            }
        >
            <GroupInvitationScreenContent searchParams={params} />
        </Suspense>
    );
}
