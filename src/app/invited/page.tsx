"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/provider/AuthProvider";
import { createInvitationService } from "@/service/invitation-service";
import { invitationRepo } from "@/infra/invitation/invitation-repo";
import { FirestoreGroupRepository } from "@/infra/group/group-repo";
import { FirestoreUserGroupRepository } from "@/infra/group/user-group-repository";
import { Group } from "@/domain/group";

const GroupInvitationScreen: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const { user } = useAuth();

    const [group, setGroup] = useState<Group | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAccepting, setIsAccepting] = useState(false);

    // Service層を経由してアクセス
    const invitationService = createInvitationService(
        invitationRepo,
        new FirestoreGroupRepository(),
        new FirestoreUserGroupRepository(),
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
    }, [token]);

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
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <Card className="w-[500px] bg-gray-200">
                    <CardHeader className="items-center justify-center text-center">
                        <CardTitle className="text-2xl font-normal text-red-600">
                            {error}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full"
                            onClick={() => router.push("/")}
                        >
                            ホームに戻る
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
                </CardContent>
            </Card>
        </div>
    );
};

export default GroupInvitationScreen;
