"use client";

import { useRouter, useSearchParams } from "next/navigation";
import GroupListSidebar from "./_components/group-list-sidebar";
import { Group } from "./_components/group-list";

interface GroupPageClientProps {
    groups: Group[];
    selectedGroupId?: string;
}

export default function GroupPageClient({ groups, selectedGroupId }: GroupPageClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleGroupSelect = (groupName: string) => {
        const group = groups.find((g) => g.name === groupName);
        if (group) {
            const params = new URLSearchParams(searchParams.toString());
            params.set("groupId", group.id);
            router.push(`/group?${params.toString()}`);
        }
    };

    // 選択されたグループ名を取得（表示用）
    const selectedGroupName = groups.find((g) => g.id === selectedGroupId)?.name || groups[0]?.name;

    return (
        <GroupListSidebar
            groups={groups}
            selectedGroupId={selectedGroupName}
            onGroupSelect={handleGroupSelect}
        />
    );
}
