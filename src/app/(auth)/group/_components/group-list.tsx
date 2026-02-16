"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import MemberMenuModal, { MenuPosition } from "./member-menu-modal";
import RemoveMemberConfirmModal from "./remove-member-confirm-modal";

//このあたりの型定義はdomain/user.ts実装後変更予定
// メンバーとグループのデータ型を定義
export interface Member {
    id: string;
    name: string;
    iconUrl?: string;
}

export interface Group {
    id: string;
    name: string;
    members: Member[]; // membersフィールドを追加
}

// GroupViewコンポーネントのプロパティを定義
interface GroupViewProps {
    group: Group;
}

const GroupMembersView: React.FC<GroupViewProps> = ({ group }) => {
    const router = useRouter();
    const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [selectedMemberForRemoval, setSelectedMemberForRemoval] =
        useState<Member | null>(null);

    const handleInviteClick = () => {
        router.push(`/invite?groupId=${group.id}`);
    };

    const handleOpenMenu = (
        memberId: string,
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setMenuPosition({
            top: rect.top + window.scrollY,
            left: rect.right + window.scrollX + 8,
        });
        setActiveMemberId(memberId);
    };

    const handleCloseMenu = () => {
        setActiveMemberId(null);
        setMenuPosition(null);
    };

    const handleRemoveClick = () => {
        const memberToRemove = group.members.find(
            (m) => m.id === activeMemberId,
        );
        if (memberToRemove) {
            setSelectedMemberForRemoval(memberToRemove);
            setConfirmModalOpen(true);
        }
    };

    const handleCloseConfirmModal = () => {
        setConfirmModalOpen(false);
        setSelectedMemberForRemoval(null);
    };

    const handleConfirmRemoval = async () => {
        // TODO: 削除処理をここに実装
        console.log(`Removing member: ${selectedMemberForRemoval?.name}`);
        handleCloseConfirmModal();
    };

    return (
        <div className="p-5 bg-gray-100 h-full flex flex-col">
            <h2 className="font-bold text-2xl text-center mb-6 text-black">
                {group.name}
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3">
                {group.members.length > 0 ? (
                    group.members.map((member: Member) => (
                        <div
                            key={member.id}
                            className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm"
                        >
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-gray-600 text-sm">
                                    👤
                                </span>
                            </div>
                            <span className="text-black font-medium">
                                {member.name}
                            </span>
                            <button
                                type="button"
                                aria-label="メンバーメニュー"
                                onClick={(event) =>
                                    handleOpenMenu(member.id, event)
                                }
                                className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <span className="text-lg leading-none">⋯</span>
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500 text-sm">
                        メンバーが存在しません
                    </p>
                )}
            </div>
            <MemberMenuModal
                isOpen={Boolean(activeMemberId)}
                position={menuPosition}
                onClose={handleCloseMenu}
                onRemoveClick={handleRemoveClick}
            />
            {selectedMemberForRemoval && (
                <RemoveMemberConfirmModal
                    isOpen={confirmModalOpen}
                    memberName={selectedMemberForRemoval.name}
                    isCurrentUser={false}
                    onConfirm={handleConfirmRemoval}
                    onCancel={handleCloseConfirmModal}
                />
            )}
            <button
                onClick={handleInviteClick}
                className="mt-6 py-2.5 px-5 rounded bg-blue-500 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors"
            >
                招待
            </button>
        </div>
    );
};

export default GroupMembersView;
