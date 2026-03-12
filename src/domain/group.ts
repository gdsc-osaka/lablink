import { DBError } from "./error";
import { ResultAsync } from "neverthrow";

const groupRoles = ["owner", "admin", "member"] as const;
type GroupRole = (typeof groupRoles)[number];

const isGroupRole = (value: unknown): value is GroupRole =>
    groupRoles.includes(value as GroupRole);

interface Group {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

interface UserGroup {
    groupId: string;
    userId: string;
    role: GroupRole;
    joinedAt: Date;
}

interface GroupMemberWithRole {
    userId: string;
    role: GroupRole;
}

interface GroupWithMembers {
    id: string;
    name: string;
    members: Array<{ id: string; name: string; role: GroupRole }>;
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
    findMembersWithRoles(
        groupId: string,
    ): ResultAsync<GroupMemberWithRole[], DBError>;
    removeMember(groupId: string, userId: string): ResultAsync<void, DBError>;
    updateMemberRole(
        groupId: string,
        userId: string,
        role: GroupRole,
    ): ResultAsync<void, DBError>;
}

export { groupRoles, isGroupRole };
export type {
    Group,
    GroupRole,
    GroupRepository,
    CreateGroupDto,
    UserGroup,
    GroupMemberWithRole,
    UserGroupRepository,
    GroupWithMembers,
};
