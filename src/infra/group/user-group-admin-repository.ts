import {
    UserGroup,
    UserGroupRepository,
    Group,
    GroupMemberWithRole,
    GroupRole,
    isGroupRole,
} from "@/domain/group";
import { UnknownError } from "@/domain/error";
import { DBError } from "@/domain/error";
import { ResultAsync, okAsync, errAsync } from "neverthrow";
import { FieldValue } from "firebase-admin/firestore";
import { handleAdminError } from "@/infra/error-admin";
import { getFirestoreAdmin } from "@/firebase/admin";
import { toGroupFromAdmin } from "./group-converter";

const db = getFirestoreAdmin();

export const userGroupAdminRepo: UserGroupRepository = {
    findAllByUserId: (userId: string): ResultAsync<Group[], DBError> => {
        const userGroupsRef = db
            .collection("users")
            .doc(userId)
            .collection("groups");

        return ResultAsync.fromPromise(
            userGroupsRef.get(),
            handleAdminError,
        ).map((snapshot) => {
            return snapshot.docs.map((doc) =>
                toGroupFromAdmin(doc.id, doc.data()),
            );
        });
    },

    addMember: (
        membership: UserGroup,
        groupData: Group,
    ): ResultAsync<void, DBError> => {
        const batch = db.batch();

        // groups/:groupId/users/:userId への書き込み
        const groupUserRef = db
            .collection("groups")
            .doc(membership.groupId)
            .collection("users")
            .doc(membership.userId);

        batch.set(groupUserRef, {
            role: membership.role,
            joinedAt: FieldValue.serverTimestamp(),
        });

        // users/:userId/groups/:groupId への書き込み
        const userGroupRef = db
            .collection("users")
            .doc(membership.userId)
            .collection("groups")
            .doc(membership.groupId);

        const userGroupIndexData = {
            name: groupData.name,
            createdAt: groupData.createdAt,
            updatedAt: groupData.updatedAt,
            joinedAt: FieldValue.serverTimestamp(),
        };

        batch.set(userGroupRef, userGroupIndexData);

        return ResultAsync.fromPromise(batch.commit(), handleAdminError).map(
            () => undefined,
        );
    },

    findUserIdsByGroupId: (groupId: string): ResultAsync<string[], DBError> => {
        const groupUsersRef = db
            .collection("groups")
            .doc(groupId)
            .collection("users");

        return ResultAsync.fromPromise(
            groupUsersRef.get(),
            handleAdminError,
        ).map((snapshot) => {
            return snapshot.docs.map((doc) => doc.id);
        });
    },

    findMembersWithRoles: (
        groupId: string,
    ): ResultAsync<GroupMemberWithRole[], DBError> => {
        const groupUsersRef = db
            .collection("groups")
            .doc(groupId)
            .collection("users");

        return ResultAsync.fromPromise(
            groupUsersRef.get(),
            handleAdminError,
        ).andThen((snapshot) => {
            const members: GroupMemberWithRole[] = [];
            for (const doc of snapshot.docs) {
                const role = doc.data().role;
                if (!isGroupRole(role)) {
                    return errAsync(
                        UnknownError(
                            `Invalid role "${role}" for user ${doc.id} in group ${groupId}`,
                        ),
                    );
                }
                members.push({ userId: doc.id, role });
            }
            return okAsync(members);
        });
    },

    removeMember: (
        groupId: string,
        userId: string,
    ): ResultAsync<void, DBError> => {
        const batch = db.batch();

        const groupUserRef = db
            .collection("groups")
            .doc(groupId)
            .collection("users")
            .doc(userId);

        const userGroupRef = db
            .collection("users")
            .doc(userId)
            .collection("groups")
            .doc(groupId);

        batch.delete(groupUserRef);
        batch.delete(userGroupRef);

        return ResultAsync.fromPromise(batch.commit(), handleAdminError).map(
            () => undefined,
        );
    },

    updateMemberRole: (
        groupId: string,
        userId: string,
        role: GroupRole,
    ): ResultAsync<void, DBError> => {
        const groupUserRef = db
            .collection("groups")
            .doc(groupId)
            .collection("users")
            .doc(userId);

        return ResultAsync.fromPromise(
            groupUserRef.update({ role }),
            handleAdminError,
        ).map(() => undefined);
    },
};
