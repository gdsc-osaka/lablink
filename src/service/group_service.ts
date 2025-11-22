import { ResultAsync, ok, err, errAsync } from "neverthrow";
import {
    Group,
    GroupRepository,
    CreateGroupDto,
    UserGroup,
    UserGroupRepository,
} from "@/domain/group";
import { ServiceError, ServiceLogicError, DBError } from "@/domain/error";

// 依存関係をまとめた型
interface GroupServiceDeps {
    groupRepo: GroupRepository;
    userGroupRepo: UserGroupRepository;
}

export interface GroupService {
    createGroupAndAddOwner: (
        userId: string,
        dto: CreateGroupDto,
    ) => ResultAsync<Group, ServiceError>;

    addGroupMember: (
        userId: string,
        groupId: string,
    ) => ResultAsync<void, ServiceError>;

    getGroupById: (groupId: string) => ResultAsync<Group, ServiceError>;

    updateGroupInfo: (
        groupId: string,
        data: Partial<Omit<Group, "id" | "createdAt" | "updatedAt">>,
    ) => ResultAsync<Group, ServiceError>;

    getGroupsByUserId: (userId: string) => ResultAsync<Group[], ServiceError>;

    getMemberIdsByGroupId: (
        groupId: string,
    ) => ResultAsync<string[], ServiceError>;

    deleteGroup: (groupId: string) => ResultAsync<void, ServiceError>;
}

const generateId = (): string => crypto.randomUUID();

export const createGroupService = ({
    groupRepo,
    userGroupRepo,
}: GroupServiceDeps): GroupService => ({
    createGroupAndAddOwner: (
        userId: string,
        dto: CreateGroupDto,
    ): ResultAsync<Group, ServiceError> => {
        if (!userId) {
            return errAsync(
                ServiceLogicError("ユーザーIDは必須です。", {
                    extra: { code: "MISSING_USER_ID" },
                }),
            );
        }
        if (!dto.name || dto.name.trim() === "") {
            return errAsync(
                ServiceLogicError("グループ名は必須です。", {
                    extra: { code: "INVALID_GROUP_NAME" },
                }),
            );
        }

        const newGroupId = generateId();
        const now = new Date();

        const newGroup: Group = {
            id: newGroupId,
            name: dto.name,
            createdAt: now,
            updatedAt: now,
        };

        // グループ作成 -> メンバー追加 をチェーン
        return groupRepo.save(newGroup, userId).andThen((savedGroup) => {
            const membership: UserGroup = {
                groupId: savedGroup.id,
                userId: userId,
                role: "owner",
                joinedAt: now,
            };
            return userGroupRepo
                .addMember(membership, savedGroup)
                .map(() => savedGroup);
        });
    },

    addGroupMember: (
        userId: string,
        groupId: string,
    ): ResultAsync<void, ServiceError> => {
        if (!userId || !groupId) {
            return errAsync(
                ServiceLogicError("ユーザーIDとグループIDは必須です。", {
                    extra: { code: "MISSING_IDS" },
                }),
            );
        }

        // グループ存在確認 -> メンバー追加
        return groupRepo.findById(groupId).andThen((group) => {
            const membership: UserGroup = {
                groupId: group.id,
                userId: userId,
                role: "member",
                joinedAt: new Date(),
            };
            return userGroupRepo.addMember(membership, group);
        });
    },

    getGroupById: (groupId: string): ResultAsync<Group, ServiceError> => {
        if (!groupId) {
            return errAsync(
                ServiceLogicError("グループIDは必須です。", {
                    extra: { code: "MISSING_GROUP_ID" },
                }),
            );
        }
        return groupRepo.findById(groupId);
    },

    updateGroupInfo: (
        groupId: string,
        data: Partial<Omit<Group, "id" | "createdAt" | "updatedAt">>,
    ): ResultAsync<Group, ServiceError> => {
        if (!groupId) {
            return errAsync(
                ServiceLogicError("グループIDは必須です。", {
                    extra: { code: "MISSING_GROUP_ID" },
                }),
            );
        }
        return groupRepo.update({ id: groupId, ...data });
    },

    getGroupsByUserId: (userId: string): ResultAsync<Group[], ServiceError> => {
        if (!userId) {
            return errAsync(
                ServiceLogicError("ユーザーIDは必須です。", {
                    extra: { code: "MISSING_USER_ID" },
                }),
            );
        }
        return userGroupRepo.findAllByUserId(userId);
    },

    getMemberIdsByGroupId: (
        groupId: string,
    ): ResultAsync<string[], ServiceError> => {
        if (!groupId) {
            return errAsync(
                ServiceLogicError("グループIDは必須です。", {
                    extra: { code: "MISSING_GROUP_ID" },
                }),
            );
        }
        return userGroupRepo.findUserIdsByGroupId(groupId);
    },

    deleteGroup: (groupId: string): ResultAsync<void, ServiceError> => {
        if (!groupId) {
            return errAsync(
                ServiceLogicError("グループIDは必須です。", {
                    extra: { code: "MISSING_GROUP_ID" },
                }),
            );
        }
        return groupRepo
            .delete(groupId)
            .map(() => undefined)
            .mapErr((error) => error as ServiceError);
    },
});
