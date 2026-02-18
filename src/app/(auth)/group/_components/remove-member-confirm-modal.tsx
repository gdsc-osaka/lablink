import React from "react";
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
            <div className="relative w-[360px] rounded-lg bg-white p-6 shadow-lg">
                <h2 className="text-lg font-bold text-black">
                    {isCurrentUser ? "グループから退会" : "メンバーを削除"}
                </h2>
                <p className="mt-4 text-sm text-gray-700">
                    {isCurrentUser
                        ? "このグループから退会します。よろしいですか？"
                        : `「${memberName}」をグループから削除します。よろしいですか？`}
                </p>
                <div className="mt-6 flex justify-end gap-3">
                    <Button
                        type="button"
                        onClick={onCancel}
                        className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                    >
                        キャンセル
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        className="rounded bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                    >
                        {isCurrentUser ? "退会" : "削除"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RemoveMemberConfirmModal;
