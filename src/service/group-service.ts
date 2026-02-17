import { ResultAsync, errAsync, okAsync } from "neverthrow";
import {
    Group,
    GroupRepository,
    CreateGroupDto,
    UserGroup,
    UserGroupRepository,
} from "@/domain/group";
import { ServiceError, ServiceLogicError, DBError } from "@/domain/error";
import { firestoreGroupAdminRepository } from "@/infra/group/group-admin-repo";
import { firestoreUserGroupAdminRepository } from "@/infra/group/user-group-admin-repository";
import { findUsersByIds } from "@/infra/user/user-admin-repo";

export interface GroupWithMembers {
    id: string;
    name: string;
    members: Array<{ id: string; name: string }>;
}

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

    getGroupsWithMembersByUserId: (
        userId: string,
    ) => ResultAsync<GroupWithMembers[], ServiceError>;

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

    getGroupsWithMembersByUserId: (
        userId: string,
    ): ResultAsync<GroupWithMembers[], ServiceError> => {
        return validateRequiredId(
            userId,
            "ユーザーID",
            "MISSING_USER_ID",
        ).andThen(() => {
            return userGroupRepo.findAllByUserId(userId).andThen((groups) => {
                // 全グループのメンバーIDを取得
                const memberPromises = groups.map((group) =>
                    userGroupRepo
                        .findUserIdsByGroupId(group.id)
                        .map((ids) => ({ groupId: group.id, memberIds: ids }))
                );

                return ResultAsync.combine(memberPromises).andThen(
                    (groupMembers) => {
                        // 全ユニークなユーザーIDを収集
                        const allUserIds = Array.from(
                            new Set(
                                groupMembers.flatMap((gm) => gm.memberIds)
                            )
                        );

                        // ユーザー情報を一括取得
                        return findUsersByIds(allUserIds).map((userMap) => {
                            return groups.map((group) => {
                                const groupMemberData = groupMembers.find(
                                    (gm) => gm.groupId === group.id
                                );
                                const memberIds =
                                    groupMemberData?.memberIds || [];

                                const members = memberIds.map((id) => {
                                    const user = userMap.get(id);
                                    return {
                                        id,
                                        name: user?.email || id,
                                    };
                                });

                                return {
                                    id: group.id,
                                    name: group.name,
                                    members,
                                };
                            });
                        });
                    }
                );
            });
        });
    },

    deleteGroup: (groupId: string): ResultAsync<void, ServiceError> => {
        return validateRequiredId(groupId, "グループID", "{}").andThen(() => {
            return groupRepo.delete(groupId);
        });
    },
});

// デフォルトのAdmin Repositoryを使ったインスタンスをexport
export const groupService = createGroupService({
    groupRepo: firestoreGroupAdminRepository,
    userGroupRepo: firestoreUserGroupAdminRepository,
});

