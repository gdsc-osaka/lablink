"use client";

import { useState } from "react";
import { createInvitationAction } from "./actions";

type InviteCreateButtonProps = {
    groupId: string | null;
    onSuccess: (token: string) => void;
    onError: (error: string) => void;
};

export default function InviteCreateButton({
    groupId,
    onSuccess,
    onError,
}: InviteCreateButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        if (!groupId) {
            onError("グループIDが指定されていません");
            return;
        }

        setIsLoading(true);
        const result = await createInvitationAction(groupId);

        if (result.success) {
            onSuccess(result.token);
        } else {
            onError(result.error);
        }
        setIsLoading(false);
    };

    return (
        <button
            onClick={handleClick}
            disabled={isLoading || !groupId}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500 hover:bg-blue-600 text-white"
        >
            {isLoading ? (
                <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    作成中...
                </>
            ) : (
                <>
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    リンクを作成
                </>
            )}
        </button>
    );
}
