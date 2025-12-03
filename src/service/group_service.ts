import { ResultAsync, errAsync, okAsync } from "neverthrow";
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

/**
 * @param value
 * @param fieldName エラーメッセージに使う項目名
 * @param errorCode エラーコード
 */
const validateRequiredId = (
    value: string | undefined | null,
    fieldName: string,
    errorCode: string,
): ResultAsync<void, ServiceError> => {
    if (!value || value.trim() === "") {
        return errAsync(
            ServiceLogicError("${fieldName}は必須です。", {
                extra: { code: errorCode },
            }),
        );
    }
    return okAsync(undefined);
};

export const createGroupService = ({
    groupRepo,
    userGroupRepo,
}: GroupServiceDeps): GroupService => ({
    createGroupAndAddOwner: (
        userId: string,
        dto: CreateGroupDto,
    ): ResultAsync<Group, ServiceError> => {
        return validateRequiredId(userId, "ユーザーID", "MISSING_USER_ID")
            .andThen(() =>
                validateRequiredId(
                    dto.name,
                    "グループ名",
                    "INVALID_GROUP_NAME",
                ),
            )

            .andThen(() => {
                const newGroupId = generateId();
                const now = new Date();

                const newGroup: Group = {
                    id: newGroupId,
                    name: dto.name,
                    createdAt: now,
                    updatedAt: now,
                };

                // グループ作成 -> メンバー追加 をチェーン
                return groupRepo
                    .save(newGroup, userId)
                    .andThen((savedGroup) => {
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
            });
    },

    addGroupMember: (
        userId: string,
        groupId: string,
    ): ResultAsync<void, ServiceError> => {
        return validateRequiredId(userId, "ユーザーID", "MISSING_IDS")
            .andThen(() =>
                validateRequiredId(groupId, "グループID", "MISSING_IDS"),
            )
            .andThen(() => {
                return groupRepo.findById(groupId).andThen((group) => {
                    const membership: UserGroup = {
                        groupId: group.id,
                        userId: userId,
                        role: "member",
                        joinedAt: new Date(),
                    };
                    return userGroupRepo.addMember(membership, group);
                });
            });
    },

    getGroupById: (groupId: string): ResultAsync<Group, ServiceError> => {
        return validateRequiredId(
            groupId,
            "グループID",
            "MISSING_GROUP_ID",
        ).andThen(() => {
            return groupRepo.findById(groupId);
        });
    },

    updateGroupInfo: (
        groupId: string,
        data: Partial<Omit<Group, "id" | "createdAt" | "updatedAt">>,
    ): ResultAsync<Group, ServiceError> => {
        return validateRequiredId(
            groupId,
            "グループID",
            "MISSING_GROUP_ID",
        ).andThen(() => {
            return groupRepo.update({ id: groupId, ...data });
        });
    },

    getGroupsByUserId: (userId: string): ResultAsync<Group[], ServiceError> => {
        return validateRequiredId(
            userId,
            "ユーザーID",
            "MISSING_USER_ID",
        ).andThen(() => {
            return userGroupRepo.findAllByUserId(userId);
        });
    },

    getMemberIdsByGroupId: (
        groupId: string,
    ): ResultAsync<string[], ServiceError> => {
        return validateRequiredId(
            groupId,
            "グループID",
            "MISSING_GROUP_ID",
        ).andThen(() => {
            return userGroupRepo.findUserIdsByGroupId(groupId);
        });
    },

    deleteGroup: (groupId: string): ResultAsync<void, ServiceError> => {
        return validateRequiredId(groupId, "グループID", "{}").andThen(() => {
            return groupRepo.delete(groupId);
        });
    },
});
