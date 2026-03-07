"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, User } from "lucide-react";
import { GroupWithMembers } from "@/domain/group";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LeaveMemberMenuItem from "./leave-member-menu-item";
import LeaveMemberDialog from "./leave-member-dialog";

// GroupViewコンポーネントのプロパティを定義
interface GroupViewProps {
    group: GroupWithMembers;
}

const GroupMembersView: React.FC<GroupViewProps> = ({ group }) => {
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [selectedMemberName, setSelectedMemberName] = useState<string | null>(
        null,
    );

    const handleOpenLeaveModal = (memberName: string) => {
        setSelectedMemberName(memberName);
        setIsLeaveModalOpen(true);
    };

    return (
        <>
            <div className="p-5 bg-gray-100 h-full flex flex-col">
                <h2 className="font-bold text-2xl text-center mb-6 text-black">
                    {group.name}
                </h2>
                <div className="flex-1 overflow-y-auto space-y-3">
                    {group.members.length > 0 ? (
                        group.members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm"
                            >
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-gray-600" />
                                </div>
                                <span className="text-black font-medium flex-1 min-w-0 truncate">
                                    {member.name}
                                </span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="text-gray-700"
                                            aria-label={`${member.name}のメニューを開く`}
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <LeaveMemberMenuItem
                                            onSelect={() =>
                                                handleOpenLeaveModal(
                                                    member.name,
                                                )
                                            }
                                        />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 text-sm">
                            メンバーが存在しません
                        </p>
                    )}
                </div>
                <Link
                    href={`/invite?groupId=${group.id}`}
                    className="mt-6 py-2.5 px-5 rounded bg-blue-500 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors text-center"
                >
                    招待
                </Link>
            </div>

            <LeaveMemberDialog
                open={isLeaveModalOpen}
                memberName={selectedMemberName}
                onOpenChange={setIsLeaveModalOpen}
            />
        </>
    );
};

export default GroupMembersView;
