"use client";

import React from "react";
import { Group } from "./group-list";

interface GroupListSidebarProps {
    groups: Group[];
    selectedGroupId?: string;
    onGroupSelect: (groupId: string) => void;
}

const GroupListSidebar: React.FC<GroupListSidebarProps> = ({
    groups,
    selectedGroupId,
    onGroupSelect,
}) => {
    return (
        <div className="bg-gray-200 w-16 h-full flex flex-col overflow-y-auto">
            {groups.map((group, index) => (
                <div
                    key={index}
                    onClick={() => onGroupSelect(group.name)}
                    className={`p-2 cursor-pointer text-xs text-center hover:bg-blue-100 transition-colors border-b border-gray-300 min-h-[60px] flex items-center justify-center ${
                        selectedGroupId === group.name
                            ? "bg-blue-500 text-white font-bold shadow-lg"
                            : "bg-gray-200 text-black hover:text-blue-700"
                    }`}
                    style={{
                        writingMode: "vertical-rl",
                        textOrientation: "mixed",
                    }}
                >
                    {group.name}
                </div>
            ))}
        </div>
    );
};

export default GroupListSidebar;
