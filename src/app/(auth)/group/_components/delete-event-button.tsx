"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteEventAction } from "../actions";

type DeleteEventButtonProps = {
    id: string;
    groupId: string;
};

export default function DeleteEventButton({
    id,
    groupId,
}: DeleteEventButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        if (!confirm("このイベントを削除しますか？")) return;
        setIsDeleting(true);
        setError(null);
        try {
            const result = await deleteEventAction(groupId, id);
            if (!result.success) {
                setError(result.error);
                setIsDeleting(false);
            }
        } catch (err) {
            console.error("Failed to delete event:", err);
            setError("削除エラー");
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex flex-col items-center w-full">
            <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full bg-red-500 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
            >
                {isDeleting ? "削除中..." : "削除"}
            </Button>
            {error && (
                <p className="text-xs text-red-600 mt-1 text-center font-medium leading-tight max-w-full">
                    {error}
                </p>
            )}
        </div>
    );
}
