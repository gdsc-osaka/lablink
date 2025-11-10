import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    getDocs,
    writeBatch,
    serverTimestamp,
    FieldValue,
    Timestamp,
    QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import { groupConverter } from "./group-converter";
import { UserGroup, UserGroupRepository, Group } from "@/domain/group";
import { GroupForDb, UserGroupIndexData } from "./group-repo";

export class FirestoreUserGroupRepository implements UserGroupRepository {
    // users/:userId/groups/:groupId ドキュメント参照
    private getUserGroupDocRef(userId: string, groupId: string) {
        return doc(db, "users", userId, "groups", groupId);
    }

    // groups/:groupId/users/:userId ドキュメント参照
    private getGroupUserDocRef(groupId: string, userId: string) {
        return doc(db, "groups", groupId, "users", userId);
    }

    async findAllByUserId(userId: string): Promise<Group[]> {
        try {
            const userGroupsRef = collection(
                db,
                "users",
                userId,
                "groups",
            ).withConverter(groupConverter);
            const userGroupsSnap = await getDocs(userGroupsRef);

            if (userGroupsSnap.empty) {
                return [];
            }

            return userGroupsSnap.docs.map((doc) => doc.data());
        } catch (error) {
            console.error(`Error finding groups for user ${userId}:`, error);
            throw new Error(
                `Failed to retrieve groups list for user ${userId} from Firestore.`,
            );
        }
    }

    async addMember(membership: UserGroup, groupData: Group): Promise<void> {
        const batch = writeBatch(db);

        const gruopUserRef = this.getGroupUserDocRef(
            membership.groupId,
            membership.userId,
        );
        batch.set(gruopUserRef, {
            role: membership.role,
            joinedAt: serverTimestamp(),
        });

        const userGroupRef = this.getUserGroupDocRef(
            membership.userId,
            membership.groupId,
        );
        const userGroupIndexData: UserGroupIndexData = {
            ...(groupData as Omit<Group, "createdAt" | "updatedAt">),

            createdAt: groupData.createdAt as unknown as Timestamp,
            updatedAt: groupData.updatedAt as unknown as Timestamp,
            joinedAt: serverTimestamp(),
        };
        batch.set(userGroupRef, userGroupIndexData);

        await batch.commit();
    }

    async findUserIdsByGroupId(groupId: string): Promise<string[]> {
        const groupUsersRef = collection(db, "groups", groupId, "users");
        const snapshot = await getDocs(groupUsersRef);
        return snapshot.docs.map((doc) => doc.id);
    }
}
