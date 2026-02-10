import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createInvitationService } from "@/service/invitation-service";
import { invitationRepo } from "@/infra/invitation/invitation-repo";
import { firestoreGroupRepository } from "@/infra/group/group-repo";
import { requireAuth } from "@/lib/auth/server-auth";
import { InvitationButtons } from "./InvitationButtons";
import type { Group } from "@/domain/group";
import type { InvitationError } from "@/domain/error";

interface PageProps {
    searchParams: { token?: string };
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

    // グループ情報の取得
    const invitationService = createInvitationService(
        invitationRepo,
        firestoreGroupRepository,
    );

    const result = await invitationService.getGroupByToken(token);

    const groupOrError = result.match(
        (group: Group) => ({ group, error: null }),
        (err: InvitationError) => ({ group: null, error: err.message }),
    );

    if (groupOrError.error || !groupOrError.group) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <Card className="w-[500px] bg-gray-200">
                    <CardHeader className="items-center justify-center text-center">
                        <CardTitle className="text-2xl font-normal text-red-600">
                            {groupOrError.error ||
                                "招待情報を読み込めませんでした"}
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
                    <InvitationButtons token={token} />
                </CardContent>
            </Card>
        </div>
    );
}

export default async function GroupInvitationScreen({
    searchParams,
}: PageProps) {
    // tokenが存在する場合に、requireAuth()へ渡してログイン時に招待ページへ戻るようにする
    await requireAuth(searchParams);

    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center min-h-screen bg-white">
                    <p className="text-xl text-gray-600">読み込み中...</p>
                </div>
            }
        >
            <GroupInvitationScreenContent searchParams={searchParams} />
        </Suspense>
    );
}
