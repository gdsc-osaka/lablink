import React from "react";

export type MenuPosition = {
    top: number;
    left: number;
};

interface MemberMenuModalProps {
    isOpen: boolean;
    position: MenuPosition | null;
    onClose: () => void;
}

const MemberMenuModal: React.FC<MemberMenuModalProps> = ({
    isOpen,
    position,
    onClose,
}) => {
    if (!isOpen || !position) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50">
            <button
                type="button"
                aria-label="閉じる"
                onClick={onClose}
                className="absolute inset-0 bg-transparent"
            />
            <div
                className="absolute w-[280px] rounded-lg bg-white p-4 shadow-lg"
                style={{ top: position.top, left: position.left }}
            >
                <h3 className="text-base font-bold text-black">メニュー</h3>
                <p className="mt-2 text-sm text-gray-600">（準備中）</p>
            </div>
        </div>
    );
};

export default MemberMenuModal;
