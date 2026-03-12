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
    findById(groupId: string): ResultAsync<Group, DBError>;
    save(group: Group, userId: string): ResultAsync<Group, DBError>;
    update(group: Partial<Group>): ResultAsync<Group, DBError>;
    delete(groupId: string): ResultAsync<void, DBError>;
}

interface UserGroupRepository {
    addMember(
        membership: UserGroup,
        groupData: Group,
    ): ResultAsync<void, DBError>;
    findAllByUserId(userId: string): ResultAsync<Group[], DBError>;
    findUserIdsByGroupId(groupId: string): ResultAsync<string[], DBError>;
}

export type {
    Group,
    GroupRepository,
    CreateGroupDto,
    UserGroup,
    UserGroupRepository,
    GroupWithMembers,
};
