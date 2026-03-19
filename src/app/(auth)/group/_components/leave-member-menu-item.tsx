"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface LeaveMemberMenuItemProps {
    onSelect: () => void;
}

export default function LeaveMemberMenuItem({
    onSelect,
}: LeaveMemberMenuItemProps) {
    return (
        <DropdownMenuItem variant="destructive" onSelect={onSelect}>
            退会
        </DropdownMenuItem>
    );
}
