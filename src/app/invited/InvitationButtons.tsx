"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { acceptGroupInvitation, declineGroupInvitation } from "./actions";

interface InvitationButtonsProps {
    token: string;
    userId: string;
}

export const InvitationButtons: React.FC<InvitationButtonsProps> = ({
    token,
    userId,
}) => {
    const router = useRouter();
    const [isAccepting, setIsAccepting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAccept = async () => {
        setIsAccepting(true);
        setError(null);

        const response = await acceptGroupInvitation(token);

        if (response.success && response.groupId) {
            router.push(`/group?id=${response.groupId}`);
        } else {
            setError(response.error || "参加に失敗しました");
            setIsAccepting(false);
        }
    };

    const handleReject = async () => {
        await declineGroupInvitation();
        router.push("/");
    };

    return (
        <div>
            {error && (
                <p className="text-red-600 text-sm mb-4 text-center">
                    {error}
                </p>
            )}
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
        </div>
    );
};
