import { UserGroup, UserGroupRepository, Group } from "@/domain/group";
import { DBError } from "@/domain/error";
import { ResultAsync } from "neverthrow";
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
            return snapshot.docs.map((doc) => toGroupFromAdmin(doc.id, doc.data()));
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
};
