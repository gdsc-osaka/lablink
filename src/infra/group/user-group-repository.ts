import {
    doc,
    collection,
    getDocs,
    writeBatch,
    updateDoc,
    serverTimestamp,
    Timestamp,
    WithFieldValue,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import { groupConverter } from "./group-converter";
import {
    UserGroup,
    UserGroupRepository,
    Group,
    GroupMemberWithRole,
    GroupRole,
    isGroupRole,
} from "@/domain/group";
import { UnknownError } from "@/domain/error";
import { UserGroupIndexData } from "./group-repo";
import { okAsync, errAsync, ResultAsync } from "neverthrow";
import { DBError } from "@/domain/error";
import { handleFirestoreError } from "../error";

export const firestoreUserGroupRepository: UserGroupRepository = {
    findAllByUserId: (userId: string): ResultAsync<Group[], DBError> => {
        const userGroupsRef = collection(
            db,
            "users",
            userId,
            "groups",
        ).withConverter(groupConverter);

        return ResultAsync.fromPromise(
            getDocs(userGroupsRef),
            handleFirestoreError,
        ).map((snapshot) => {
            return snapshot.docs.map((doc) => doc.data());
        });
    },

    addMember: (
        membership: UserGroup,
        groupData: Group,
    ): ResultAsync<void, DBError> => {
        const batch = writeBatch(db);

        // groups/:groupId/users/:userId への書き込み
        const groupUserRef = doc(
            db,
            "groups",
            membership.groupId,
            "users",
            membership.userId,
        );

        batch.set(groupUserRef, {
            role: membership.role,
            joinedAt: serverTimestamp(),
        });

        // users/:userId/groups/:groupId への書き込み
        const userGroupRef = doc(
            db,
            "users",
            membership.userId,
            "groups",
            membership.groupId,
        );

        const userGroupIndexData: WithFieldValue<UserGroupIndexData> = {
            ...groupData,
            createdAt: Timestamp.fromDate(groupData.createdAt),
            updatedAt: Timestamp.fromDate(groupData.updatedAt),
            joinedAt: serverTimestamp(),
        };

        batch.set(userGroupRef, userGroupIndexData);

        return ResultAsync.fromPromise(
            batch.commit(),
            handleFirestoreError,
        ).map(() => undefined);
    },

    findUserIdsByGroupId: (groupId: string): ResultAsync<string[], DBError> => {
        const groupUsersRef = collection(db, "groups", groupId, "users");

        return ResultAsync.fromPromise(
            getDocs(groupUsersRef),
            handleFirestoreError,
        ).map((snapshot) => {
            return snapshot.docs.map((doc) => doc.id);
        });
    },

    findMembersWithRoles: (
        groupId: string,
    ): ResultAsync<GroupMemberWithRole[], DBError> => {
        const groupUsersRef = collection(db, "groups", groupId, "users");

        return ResultAsync.fromPromise(
            getDocs(groupUsersRef),
            handleFirestoreError,
        ).andThen((snapshot) => {
            const members: GroupMemberWithRole[] = [];
            for (const memberDoc of snapshot.docs) {
                const role = memberDoc.data().role;
                if (!isGroupRole(role)) {
                    return errAsync(
                        UnknownError(
                            `Invalid role "${role}" for user ${memberDoc.id} in group ${groupId}`,
                        ),
                    );
                }
                members.push({ userId: memberDoc.id, role });
            }
            return okAsync(members);
        });
    },

    removeMember: (
        groupId: string,
        userId: string,
    ): ResultAsync<void, DBError> => {
        const batch = writeBatch(db);

        const groupUserRef = doc(db, "groups", groupId, "users", userId);
        const userGroupRef = doc(db, "users", userId, "groups", groupId);

        batch.delete(groupUserRef);
        batch.delete(userGroupRef);

        return ResultAsync.fromPromise(
            batch.commit(),
            handleFirestoreError,
        ).map(() => undefined);
    },

    updateMemberRole: (
        groupId: string,
        userId: string,
        role: Exclude<GroupRole, "owner">,
    ): ResultAsync<void, DBError> => {
        const groupUserRef = doc(db, "groups", groupId, "users", userId);

        return ResultAsync.fromPromise(
            updateDoc(groupUserRef, { role }),
            handleFirestoreError,
        ).map(() => undefined);
    },

    transferOwnership: (
        groupId: string,
        fromUserId: string,
        toUserId: string,
    ): ResultAsync<void, DBError> => {
        const batch = writeBatch(db);

        const fromRef = doc(db, "groups", groupId, "users", fromUserId);
        const toRef = doc(db, "groups", groupId, "users", toUserId);

        batch.update(toRef, { role: "owner" });
        batch.update(fromRef, { role: "admin" });

        return ResultAsync.fromPromise(
            batch.commit(),
            handleFirestoreError,
        ).map(() => undefined);
    },
};
