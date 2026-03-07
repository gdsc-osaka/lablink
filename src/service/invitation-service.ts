import { ResultAsync, okAsync, errAsync } from "neverthrow";
import { Invitation, InvitationRepository } from "@/domain/invitation";
<<<<<<< HEAD
import {
    DBError,
    ExpiredError,
    InvitationError,
    NotFoundError,
    UnknownError,
} from "@/domain/error";
import {
    Group,
    GroupRepository,
    UserGroup,
    UserGroupRepository,
} from "@/domain/group";
=======
import { DBError, ExpiredError, InvitationError } from "@/domain/error";
import { Group, GroupRepository } from "@/domain/group";
>>>>>>> origin/main

export interface InvitationService {
    // 招待を作成
    createInvitation(
        groupId: string,
        expiresInDays?: number,
    ): ResultAsync<Invitation, DBError>;

    // トークンで招待を検証
    validateInvitation(token: string): ResultAsync<Invitation, InvitationError>;

    // トークンからグループ情報を取得
    getGroupByToken(token: string): ResultAsync<Group, InvitationError>;

    // 招待を受け入れてグループに参加
    acceptInvitation(
        token: string,
        userId: string,
    ): ResultAsync<Group, InvitationError>;
<<<<<<< HEAD
=======

    // 招待を拒否
    declineInvitation(token: string): ResultAsync<void, InvitationError>;
>>>>>>> origin/main
}

function generateToken(): string {
    return crypto.randomUUID().replace(/-/g, "");
}

export function createInvitationService(
    invitationRepo: InvitationRepository,
    groupRepo: GroupRepository,
<<<<<<< HEAD
    userGroupRepo: UserGroupRepository,
=======
>>>>>>> origin/main
): InvitationService {
    const validateInvitation = (token: string) => {
        return invitationRepo.findByToken(token).andThen((invitation) => {
            if (new Date() > invitation.expiresAt) {
                return errAsync(
                    ExpiredError("招待リンクの有効期限が切れています"),
                );
            }
<<<<<<< HEAD
=======
            if (invitation.status === "declined") {
                return errAsync(
                    ExpiredError("この招待リンクは拒否されています"),
                );
            }
            if (invitation.status === "accepted" || invitation.usedAt) {
                return errAsync(
                    ExpiredError("この招待リンクは既に使用されています"),
                );
            }
>>>>>>> origin/main
            return okAsync(invitation);
        });
    };

    return {
        createInvitation: (groupId, expiresInDays = 7) => {
            const invitation: Invitation = {
                id: crypto.randomUUID(),
                groupId,
                token: generateToken(),
<<<<<<< HEAD
=======
                status: "pending",
>>>>>>> origin/main
                createdAt: new Date(),
                expiresAt: new Date(
                    Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
                ),
            };
            return invitationRepo.create(invitation);
        },

        validateInvitation,

        getGroupByToken: (token) => {
            return validateInvitation(token).andThen((invitation) =>
                groupRepo.findById(invitation.groupId),
            );
        },

        acceptInvitation: (token, userId) => {
            return validateInvitation(token)
<<<<<<< HEAD
                .andThen((invitation) =>
                    // グループ情報を取得
                    groupRepo.findById(invitation.groupId),
                )
                .andThen((group) => {
                    // メンバーを追加
                    const membership: UserGroup = {
                        groupId: group.id,
                        userId,
                        role: "member",
                        joinedAt: new Date(),
                    };

                    return userGroupRepo
                        .addMember(membership, group)
                        .map(() => group);
                });
        },
=======
                .andThen((invitation) => {
                    // トランザクションで招待受け入れ + メンバー追加を原子的に実行
                    return invitationRepo
                        .acceptInvitationTransaction(
                            invitation.id,
                            userId,
                            invitation.groupId,
                        )
                        .map(() => invitation.groupId);
                })
                .andThen((groupId) => {
                    // グループ情報を取得して返す
                    return groupRepo.findById(groupId);
                });
        },

        declineInvitation: (token) => {
            return validateInvitation(token).andThen(() => {
                return invitationRepo.decline(token);
            });
        },
>>>>>>> origin/main
    };
}
