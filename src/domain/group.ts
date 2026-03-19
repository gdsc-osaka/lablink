import { DBError } from "./error";
import { ResultAsync } from "neverthrow";

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

interface GroupWithMembers {
    id: string;
    name: string;
    members: Array<{ id: string; name: string }>;
}

type CreateGroupDto = Omit<Group, "id" | "createdAt" | "updatedAt">;

interface GroupRepository {
    getGroupById(groupId: string): ResultAsync<Group, DBError>;
    saveGroup(group: Group): ResultAsync<Group, DBError>;
    updateGroup(group: Partial<Group>): ResultAsync<Group, DBError>;
    deleteGroup(groupId: string): ResultAsync<void, DBError>;
}

interface UserGroupRepository {
    addMember(
        membership: UserGroup,
        groupData: Group,
    ): ResultAsync<void, DBError>;
    getGroupsByUserId(userId: string): ResultAsync<Group[], DBError>;
    getUserIdsByGroupId(groupId: string): ResultAsync<string[], DBError>;
}

export type {
    Group,
    GroupRepository,
    CreateGroupDto,
    UserGroup,
    UserGroupRepository,
    GroupWithMembers,
};
