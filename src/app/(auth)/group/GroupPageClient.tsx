"use client";

import { useRouter, useSearchParams } from "next/navigation";
import GroupListSidebar from "./_components/group-list-sidebar";
import { Group } from "./_components/group-list";

interface GroupPageClientProps {
    groups: Group[];
    selectedGroupId?: string;
}

export default function GroupPageClient({
    groups,
    selectedGroupId,
}: GroupPageClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleGroupSelect = (groupId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("groupId", groupId);
        router.push(`/group?${params.toString()}`);
    };

    return (
        <GroupListSidebar
            groups={groups}
            selectedGroupId={selectedGroupId}
            onGroupSelect={handleGroupSelect}
        />
    );
}
