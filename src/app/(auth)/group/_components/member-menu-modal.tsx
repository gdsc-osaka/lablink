import React from "react";

export type MenuPosition = {
    top: number;
    left: number;
};

interface MemberMenuModalProps {
    isOpen: boolean;
    position: MenuPosition | null;
    onClose: () => void;
    onRemoveClick: () => void;
}

const MemberMenuModal: React.FC<MemberMenuModalProps> = ({
    isOpen,
    position,
    onClose,
    onRemoveClick,
}) => {
    if (!isOpen || !position) {
        return null;
    }

    const handleRemoveClick = () => {
        onRemoveClick();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50">
            <button
                type="button"
                aria-label="閉じる"
                onClick={onClose}
                className="absolute inset-0 bg-transparent"
            />
            <div
                className="absolute w-[200px] rounded-lg bg-white shadow-lg"
                style={{ top: position.top, left: position.left }}
            >
                <button
                    type="button"
                    onClick={handleRemoveClick}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 first:rounded-t-lg last:rounded-b-lg"
                >
                    削除
                </button>
            </div>
        </div>
    );
};

export default MemberMenuModal;
