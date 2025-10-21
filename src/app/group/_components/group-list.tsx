"use client";

import React from "react";

//このあたりの型定義はdomain/user.ts実装後変更予定
// メンバーとグループのデータ型を定義
export interface Member {
    id: string;
    name: string;
    iconUrl?: string;
}

export interface Group {
    name: string;
    members: Member[]; // membersフィールドを追加
}

// GroupViewコンポーネントのプロパティを定義
interface GroupViewProps {
    group: Group;
}

const GroupMembersView: React.FC<GroupViewProps> = ({ group }) => {
    const handleInviteClick = () => {
        alert("招待ボタンがクリックされました。");
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
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500 text-sm">
                        メンバーが存在しません
                    </p>
                )}
            </div>
            <button
                onClick={handleInviteClick}
                className="mt-6 py-2.5 px-5 rounded bg-blue-500 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors"
            >
                招待
            </button>
        </div>
    );
};

// 後方互換性のため
const GroupView = GroupMembersView;

export default GroupView;
