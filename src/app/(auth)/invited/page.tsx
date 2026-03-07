<<<<<<< HEAD
"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/provider/AuthProvider";
import { createInvitationService } from "@/service/invitation-service";
import { invitationRepo } from "@/infra/invitation/invitation-repo";
import { firestoreGroupRepository } from "@/infra/group/group-repo";
import { firestoreUserGroupRepository } from "@/infra/group/user-group-repository";
import { Group } from "@/domain/group";

const GroupInvitationScreenContent: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const { user } = useAuth();

    const [group, setGroup] = useState<Group | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAccepting, setIsAccepting] = useState(false);

    // Service層を経由してアクセス
    const invitationService = useMemo(
        () =>
            createInvitationService(
                invitationRepo,
                firestoreGroupRepository,
                firestoreUserGroupRepository,
            ),
        [],
    );

    useEffect(() => {
        const fetchGroupInfo = async () => {
            if (!token) {
                setError("招待リンクが無効です");
                setIsLoading(false);
                return;
            }

            const result = await invitationService.getGroupByToken(token);

            result.match(
                (groupData) => {
                    setGroup(groupData);
                },
                (err) => {
                    setError(err.message);
                },
            );

            setIsLoading(false);
        };

        fetchGroupInfo();
    }, [token, invitationService]);

    const handleAccept = async () => {
        if (!token || !user) {
            setError("ログインが必要です");
            return;
        }

        setIsAccepting(true);

        const result = await invitationService.acceptInvitation(
            token,
            user.uid,
        );

        result.match(
            (groupData) => {
                router.push(`/group?id=${groupData.id}`);
            },
            (err) => {
                setError(err.message);
                setIsAccepting(false);
            },
        );
    };

    const handleReject = () => {
        router.push("/");
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <p className="text-xl text-gray-600">読み込み中...</p>
            </div>
        );
    }

    if (error) {
=======
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createInvitationService } from "@/service/invitation-service";
import { invitationRepo } from "@/infra/invitation/invitation-repo";
import { firestoreGroupAdminRepository } from "@/infra/group/group-admin-repo";
import { requireAuth } from "@/lib/auth/server-auth";
import { InvitationButtons } from "./InvitationButtons";
import type { Group } from "@/domain/group";
import type { InvitationError } from "@/domain/error";

interface PageProps {
    searchParams: Promise<{ token?: string }>;
}

async function GroupInvitationScreenContent({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
    const { token } = await searchParams;

    await requireAuth({ token });

    if (!token) {
>>>>>>> origin/main
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <Card className="w-[500px] bg-gray-200">
                    <CardHeader className="items-center justify-center text-center">
                        <CardTitle className="text-2xl font-normal text-red-600">
<<<<<<< HEAD
                            {error}
=======
                            招待リンクが無効です
>>>>>>> origin/main
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full"
<<<<<<< HEAD
                            onClick={() => router.push("/")}
                        >
                            ホームに戻る
=======
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
        firestoreGroupAdminRepository,
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
>>>>>>> origin/main
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
<<<<<<< HEAD
                        「{group?.name}」 に招待されています
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between gap-12">
                        <Button
                            variant="outline"
                            size="lg"
                            className="flex-1"
                            onClick={handleReject}
                            disabled={isAccepting}
                        >
                            拒否する
                        </Button>
                        <Button
                            variant="default"
                            size="lg"
                            className="flex-1"
                            onClick={handleAccept}
                            disabled={isAccepting}
                        >
                            {isAccepting ? "参加中..." : "参加する"}
                        </Button>
                    </div>
=======
                        「{groupOrError.group.name}」 に招待されています
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <InvitationButtons token={token} />
>>>>>>> origin/main
                </CardContent>
            </Card>
        </div>
    );
<<<<<<< HEAD
};

const GroupInvitationScreen: React.FC = () => {
=======
}

export default async function GroupInvitationScreen({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
>>>>>>> origin/main
    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center min-h-screen bg-white">
                    <p className="text-xl text-gray-600">読み込み中...</p>
                </div>
            }
        >
<<<<<<< HEAD
            <GroupInvitationScreenContent />
        </Suspense>
    );
};

export default GroupInvitationScreen;
=======
            <GroupInvitationScreenContent searchParams={searchParams} />
        </Suspense>
    );
}
>>>>>>> origin/main
