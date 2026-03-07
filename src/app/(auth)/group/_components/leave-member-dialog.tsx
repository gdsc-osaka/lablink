"use client";

import { useState } from "react";
import { removeGroupMember } from "../actions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LeaveMemberDialogProps {
    open: boolean;
    memberName: string | null;
    memberId: string | null;
    groupId: string;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export default function LeaveMemberDialog({
    open,
    memberName,
    memberId,
    groupId,
    onOpenChange,
    onSuccess,
}: LeaveMemberDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        if (!memberId) return;

        setIsLoading(true);
        setError(null);

        const result = await removeGroupMember(groupId, memberId);

        if (!result.success) {
            setError(result.error || "削除に失敗しました");
            setIsLoading(false);
            return;
        }

        // 成功時
        onOpenChange(false);
        setIsLoading(false);
        onSuccess?.();
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>退会</AlertDialogTitle>
                    <AlertDialogDescription>
                        {memberName
                            ? `${memberName}をこのグループから退会させますか？`
                            : "このユーザーをこのグループから退会させますか?"}
                    </AlertDialogDescription>
                    {error && (
                        <div className="text-red-600 text-sm mt-2 font-medium">
                            {error}
                        </div>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>
                        キャンセル
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50"
                        disabled={isLoading}
                        onClick={handleConfirm}
                    >
                        {isLoading ? "削除中..." : "退会"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
