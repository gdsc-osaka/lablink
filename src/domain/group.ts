interface Group {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

interface GroupRepository {
    findById(groupId: string): Promise<Group | null>;
    create(
        group: Omit<Group, "id" | "createdAt" | "updatedAt">,
        userId: string,
    ): Promise<Group>;
    update(group: Partial<Group>): Promise<Group>;
    delete(groupId: string): Promise<void>;
    findAllByUserId(userId: string): Promise<Group[]>;
    addUserToGroup(groupId: string, userId: string): Promise<void>;
}

export type { Group, GroupRepository };
