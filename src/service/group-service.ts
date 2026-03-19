import { ResultAsync, errAsync, okAsync } from "neverthrow";
import {
    Group,
    GroupRole,
    GroupRepository,
    CreateGroupDto,
    UserGroup,
    UserGroupRepository,
    GroupWithMembers,
} from "@/domain/group";
import { ServiceError, ServiceLogicError } from "@/domain/error";
import { findUsersByIds } from "@/infra/user/user-admin-repo";
// ui層のコンポーネントから直接インフラ層をインポートするのは避けたいので、service層でインフラ層を呼び出しました。

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

    getGroupById: (
        userId: string,
        groupId: string,
    ) => ResultAsync<Group, ServiceError>;

    updateGroupInfo: (
        userId: string,
        groupId: string,
        data: Partial<Omit<Group, "id" | "createdAt" | "updatedAt">>,
    ) => ResultAsync<Group, ServiceError>;

    getGroupsByUserId: (userId: string) => ResultAsync<Group[], ServiceError>;

    getMemberIdsByGroupId: (
        userId: string,
        groupId: string,
    ) => ResultAsync<string[], ServiceError>;

    getGroupsWithMembersByUserId: (
        userId: string,
    ) => ResultAsync<GroupWithMembers[], ServiceError>;

    deleteGroup: (
        groupId: string,
        requesterId: string,
    ) => ResultAsync<void, ServiceError>;

    removeMember: (
        groupId: string,
        requesterId: string,
        targetUserId: string,
    ) => ResultAsync<void, ServiceError>;

    changeMemberRole: (
        groupId: string,
        requesterId: string,
        targetUserId: string,
        newRole: Exclude<GroupRole, "owner">,
    ) => ResultAsync<void, ServiceError>;

    transferOwnership: (
        groupId: string,
        currentOwnerId: string,
        newOwnerId: string,
    ) => ResultAsync<void, ServiceError>;
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
            ServiceLogicError(`${fieldName}は必須です。`, {
                extra: { code: errorCode },
            }),
        );
    }
    return okAsync(undefined);
};

const createMembershipCheck = (userGroupRepo: UserGroupRepository) => {
    return (
        userId: string,
        groupId: string,
    ): ResultAsync<void, ServiceError> => {
        return userGroupRepo
            .getUserIdsByGroupId(groupId)
            .andThen((memberIds) => {
                if (!memberIds.includes(userId)) {
                    return errAsync(
                        ServiceLogicError(
                            "このグループへのアクセス権限がありません。",
                            { extra: { code: "PERMISSION_DENIED" } },
                        ),
                    );
                }
                return okAsync(undefined);
            });
    };
};

export const createGroupService = ({
    groupRepo,
    userGroupRepo,
}: GroupServiceDeps): GroupService => {
    const verifyMembership = createMembershipCheck(userGroupRepo);

    return {
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
                        .saveGroup(newGroup)
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
                    return groupRepo.getGroupById(groupId).andThen((group) => {
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

        getGroupById: (
            userId: string,
            groupId: string,
        ): ResultAsync<Group, ServiceError> => {
            return validateRequiredId(userId, "ユーザーID", "MISSING_USER_ID")
                .andThen(() =>
                    validateRequiredId(
                        groupId,
                        "グループID",
                        "MISSING_GROUP_ID",
                    ),
                )
                .andThen(() => verifyMembership(userId, groupId))
                .andThen(() => groupRepo.getGroupById(groupId));
        },

        updateGroupInfo: (
            userId: string,
            groupId: string,
            data: Partial<Omit<Group, "id" | "createdAt" | "updatedAt">>,
        ): ResultAsync<Group, ServiceError> => {
            return validateRequiredId(userId, "ユーザーID", "MISSING_USER_ID")
                .andThen(() =>
                    validateRequiredId(
                        groupId,
                        "グループID",
                        "MISSING_GROUP_ID",
                    ),
                )
                .andThen(() => verifyMembership(userId, groupId))
                .andThen(() => groupRepo.updateGroup({ id: groupId, ...data }));
        },

        getGroupsByUserId: (
            userId: string,
        ): ResultAsync<Group[], ServiceError> => {
            return validateRequiredId(
                userId,
                "ユーザーID",
                "MISSING_USER_ID",
            ).andThen(() => {
                return userGroupRepo.getGroupsByUserId(userId);
            });
        },

        getMemberIdsByGroupId: (
            userId: string,
            groupId: string,
        ): ResultAsync<string[], ServiceError> => {
            return validateRequiredId(userId, "ユーザーID", "MISSING_USER_ID")
                .andThen(() =>
                    validateRequiredId(
                        groupId,
                        "グループID",
                        "MISSING_GROUP_ID",
                    ),
                )
                .andThen(() => verifyMembership(userId, groupId))
                .andThen(() => userGroupRepo.getUserIdsByGroupId(groupId));
        },

        getGroupsWithMembersByUserId: (
            userId: string,
        ): ResultAsync<GroupWithMembers[], ServiceError> => {
            return validateRequiredId(
                userId,
                "ユーザーID",
                "MISSING_USER_ID",
            ).andThen(() => {
                return userGroupRepo
                    .getGroupsByUserId(userId)
                    .andThen((groups) => {
                        // 全グループのメンバー（ロール付き）を取得
                        const memberPromises = groups.map((group) =>
                            userGroupRepo
                                .findMembersWithRoles(group.id)
                                .map((members) => ({
                                    groupId: group.id,
                                    members,
                                })),
                        );

                        return ResultAsync.combine(memberPromises).andThen(
                            (groupMembers) => {
                                // 全ユニークなユーザーIDを収集
                                const allUserIds = Array.from(
                                    new Set(
                                        groupMembers.flatMap((gm) =>
                                            gm.members.map((m) => m.userId),
                                        ),
                                    ),
                                );

                                // ユーザー情報を一括取得
                                return findUsersByIds(allUserIds).andThen(
                                    (userMap) => {
                                        const groupsWithMembers = groups.map(
                                            (group) => {
                                                const groupMemberData =
                                                    groupMembers.find(
                                                        (gm) =>
                                                            gm.groupId ===
                                                            group.id,
                                                    );

                                                const members = (
                                                    groupMemberData?.members ??
                                                    []
                                                ).map(
                                                    ({ userId: id, role }) => {
                                                        const user =
                                                            userMap.get(id);
                                                        if (!user) {
                                                            console.warn(
                                                                `User not found for ID: ${id} in group ${group.id}`,
                                                            );
                                                            return {
                                                                id,
                                                                name: "Unknown User",
                                                                role,
                                                            };
                                                        }
                                                        return {
                                                            id,
                                                            name: user.email,
                                                            role,
                                                        };
                                                    },
                                                );

                                                return {
                                                    id: group.id,
                                                    name: group.name,
                                                    members,
                                                };
                                            },
                                        );
                                        return okAsync(groupsWithMembers);
                                    },
                                );
                            },
                        );
                    });
            });
        },

        deleteGroup: (
            groupId: string,
            requesterId: string,
        ): ResultAsync<void, ServiceError> => {
            return validateRequiredId(groupId, "グループID", "MISSING_GROUP_ID")
                .andThen(() =>
                    validateRequiredId(
                        requesterId,
                        "リクエスターID",
                        "MISSING_USER_ID",
                    ),
                )
                .andThen(() => userGroupRepo.findMembersWithRoles(groupId))
                .andThen((members) => {
                    const requester = members.find(
                        (m) => m.userId === requesterId,
                    );
                    if (!requester || requester.role !== "owner") {
                        return errAsync(
                            ServiceLogicError(
                                "グループを削除できるのはオーナーのみです",
                                {
                                    extra: { code: "FORBIDDEN" },
                                },
                            ),
                        );
                    }
                    return groupRepo.deleteGroup(groupId);
                });
        },

        removeMember: (
            groupId: string,
            requesterId: string,
            targetUserId: string,
        ): ResultAsync<void, ServiceError> => {
            return validateRequiredId(groupId, "グループID", "MISSING_GROUP_ID")
                .andThen(() =>
                    validateRequiredId(
                        requesterId,
                        "リクエスターID",
                        "MISSING_USER_ID",
                    ),
                )
                .andThen(() =>
                    validateRequiredId(
                        targetUserId,
                        "対象ユーザーID",
                        "MISSING_USER_ID",
                    ),
                )
                .andThen(() => userGroupRepo.findMembersWithRoles(groupId))
                .andThen((members) => {
                    const requester = members.find(
                        (m) => m.userId === requesterId,
                    );
                    if (!requester) {
                        return errAsync(
                            ServiceLogicError("グループに所属していません", {
                                extra: { code: "FORBIDDEN" },
                            }),
                        );
                    }
                    const isSelf = requesterId === targetUserId;
                    if (!isSelf && requester.role === "member") {
                        return errAsync(
                            ServiceLogicError(
                                "他のメンバーを退会させる権限がありません",
                                {
                                    extra: { code: "FORBIDDEN" },
                                },
                            ),
                        );
                    }
                    const target = members.find(
                        (m) => m.userId === targetUserId,
                    );
                    if (!target) {
                        return errAsync(
                            ServiceLogicError("対象ユーザーが見つかりません", {
                                extra: { code: "NOT_FOUND" },
                            }),
                        );
                    }
                    // owner は owner を退会させられない
                    if (target.role === "owner") {
                        return errAsync(
                            ServiceLogicError(
                                "オーナーを退会させることはできません",
                                {
                                    extra: { code: "FORBIDDEN" },
                                },
                            ),
                        );
                    }
                    return userGroupRepo.removeMember(groupId, targetUserId);
                });
        },

        changeMemberRole: (
            groupId: string,
            requesterId: string,
            targetUserId: string,
            newRole: Exclude<GroupRole, "owner">,
        ): ResultAsync<void, ServiceError> => {
            return validateRequiredId(groupId, "グループID", "MISSING_GROUP_ID")
                .andThen(() =>
                    validateRequiredId(
                        requesterId,
                        "リクエスターID",
                        "MISSING_USER_ID",
                    ),
                )
                .andThen(() =>
                    validateRequiredId(
                        targetUserId,
                        "対象ユーザーID",
                        "MISSING_USER_ID",
                    ),
                )
                .andThen(() => userGroupRepo.findMembersWithRoles(groupId))
                .andThen((members) => {
                    const requester = members.find(
                        (m) => m.userId === requesterId,
                    );
                    // ロール変更は owner のみ
                    if (!requester || requester.role !== "owner") {
                        return errAsync(
                            ServiceLogicError("ロール変更権限がありません", {
                                extra: { code: "FORBIDDEN" },
                            }),
                        );
                    }
                    const target = members.find(
                        (m) => m.userId === targetUserId,
                    );
                    if (!target) {
                        return errAsync(
                            ServiceLogicError("対象ユーザーが見つかりません", {
                                extra: { code: "NOT_FOUND" },
                            }),
                        );
                    }
                    // owner のロールは変更不可（owner が不在になることを防ぐ）
                    if (target.role === "owner") {
                        return errAsync(
                            ServiceLogicError("ownerのロールは変更できません", {
                                extra: { code: "FORBIDDEN" },
                            }),
                        );
                    }
                    return userGroupRepo.updateMemberRole(
                        groupId,
                        targetUserId,
                        newRole,
                    );
                });
        },

        transferOwnership: (
            groupId: string,
            currentOwnerId: string,
            newOwnerId: string,
        ): ResultAsync<void, ServiceError> => {
            return validateRequiredId(groupId, "グループID", "MISSING_GROUP_ID")
                .andThen(() =>
                    validateRequiredId(
                        currentOwnerId,
                        "現ownerID",
                        "MISSING_USER_ID",
                    ),
                )
                .andThen(() =>
                    validateRequiredId(
                        newOwnerId,
                        "移譲先ユーザーID",
                        "MISSING_USER_ID",
                    ),
                )
                .andThen(() => {
                    if (currentOwnerId === newOwnerId) {
                        return errAsync(
                            ServiceLogicError(
                                "移譲先は自分以外のユーザーを指定してください",
                                {
                                    extra: { code: "INVALID_ARGUMENT" },
                                },
                            ),
                        );
                    }
                    return userGroupRepo.findMembersWithRoles(groupId);
                })
                .andThen((members) => {
                    const currentOwner = members.find(
                        (m) => m.userId === currentOwnerId,
                    );
                    if (!currentOwner || currentOwner.role !== "owner") {
                        return errAsync(
                            ServiceLogicError("owner権限がありません", {
                                extra: { code: "FORBIDDEN" },
                            }),
                        );
                    }
                    const newOwner = members.find(
                        (m) => m.userId === newOwnerId,
                    );
                    if (!newOwner) {
                        return errAsync(
                            ServiceLogicError(
                                "移譲先のユーザーがグループに存在しません",
                                {
                                    extra: { code: "NOT_FOUND" },
                                },
                            ),
                        );
                    }
                    return userGroupRepo.transferOwnership(
                        groupId,
                        currentOwnerId,
                        newOwnerId,
                    );
                });
        },
    };
};
