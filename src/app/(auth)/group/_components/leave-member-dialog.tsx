"use client";

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
    onOpenChange: (open: boolean) => void;
}

export default function LeaveMemberDialog({
    open,
    memberName,
    onOpenChange,
}: LeaveMemberDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>退会</AlertDialogTitle>
                    <AlertDialogDescription>
                        {memberName
                            ? `${memberName}をこのグループから退会させますか？`
                            : "このユーザーをこのグループから退会させますか？"}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">
                        退会
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
