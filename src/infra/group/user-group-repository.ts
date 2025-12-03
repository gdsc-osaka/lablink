import {
    doc,
    collection,
    getDocs,
    writeBatch,
    serverTimestamp,
    Timestamp,
    WithFieldValue,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import { groupConverter } from "./group-converter";
import { UserGroup, UserGroupRepository, Group } from "@/domain/group";
import { UserGroupIndexData } from "./group-repo";
import { ok, ResultAsync } from "neverthrow";
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
};
