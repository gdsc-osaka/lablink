import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface RemoveMemberConfirmModalProps {
    isOpen: boolean;
    memberName: string;
    isCurrentUser: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const RemoveMemberConfirmModal: React.FC<RemoveMemberConfirmModalProps> = ({
    isOpen,
    memberName,
    isCurrentUser,
    onConfirm,
    onCancel,
}) => {
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const triggerRef = useRef<Element | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onCancel]);

    useEffect(() => {
        if (isOpen) {
            triggerRef.current = document.activeElement;
            cancelButtonRef.current?.focus();
        } else {
            (triggerRef.current as HTMLElement | null)?.focus();
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <button
                type="button"
                aria-label="閉じる"
                onClick={onCancel}
                className="absolute inset-0 bg-black/30"
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="remove-member-title"
                className="relative w-[360px] rounded-lg bg-white p-6 shadow-lg"
            >
                <h2
                    id="remove-member-title"
                    className="text-lg font-bold text-black"
                >
                    {isCurrentUser ? "グループから退会" : "メンバーを削除"}
                </h2>
                <p className="mt-4 text-sm text-gray-700">
                    {isCurrentUser
                        ? "このグループから退会します。よろしいですか？"
                        : `「${memberName}」をグループから削除します。よろしいですか？`}
                </p>
                <div className="mt-6 flex justify-end gap-3">
                    <Button
                        ref={cancelButtonRef}
                        type="button"
                        onClick={onCancel}
                        variant="outline"
                    >
                        キャンセル
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        variant="destructive"
                    >
                        {isCurrentUser ? "退会" : "削除"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RemoveMemberConfirmModal;
