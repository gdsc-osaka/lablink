interface Group {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

interface UserGroup {
    groupId: string;
    userId: string;
    role: "owner" | "member";
    joinedAt: Date;
}

type CreateGroupDto = Omit<Group, "id" | "createdAt" | "updatedAt">;

interface GroupRepository {
    findById(groupId: string): Promise<Group | null>;
    save(group: Group, userId: string): Promise<Group>;
    update(group: Partial<Group>): Promise<Group>;
    delete(groupId: string): Promise<void>;
}

interface UserGroupRepository {
    addMember(membership: UserGroup, groupData: Group): Promise<void>;
    findAllByUserId(userId: string): Promise<Group[]>;
    findUserIdsByGroupId(groupId: string): Promise<string[]>;
}

export type {
    Group,
    GroupRepository,
    CreateGroupDto,
    UserGroup,
    UserGroupRepository,
};
