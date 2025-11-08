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
} from "firebase/firestore";
import { db } from "@/firebase/client";
import { groupConverter } from "./group-converter";
import { Group, GroupRepository } from "@/domain/group";

export type GroupForDb = Omit<Group, "createdAt" | "updatedAt"> & {
    createdAt: Timestamp | ReturnType<typeof serverTimestamp>;
    updatedAt: Timestamp | ReturnType<typeof serverTimestamp>;
};

export type UserGroupIndexData = GroupForDb & {
    joinedAt: Timestamp | ReturnType<typeof serverTimestamp>;
};

type GroupUpdateData = Partial<Omit<Group, "updatedAt">> & {
    updatedAt: FieldValue;
};

export class FirestoreGroupRepository implements GroupRepository {
    private get groupCollectionRef() {
        return collection(db, "groups").withConverter(groupConverter);
    }

    // groups/:groupId ドキュメント参照
    private getGroupDocRef(groupId: string) {
        return doc(this.groupCollectionRef, groupId);
    }

    async findById(groupId: string): Promise<Group | null> {
        try {
            const docRef = this.getGroupDocRef(groupId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                return null;
            }

            return docSnap.data();
        } catch (error) {
            console.error(`Error finding group by ID ${groupId}:`, error);
            throw new Error(
                `Failed to retrieve group with ID ${groupId} from Firestore.`,
            );
        }
    }

    async save(group: Group): Promise<Group> {
        const groupDataToSave: GroupForDb = {
            ...group,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const groupRef = doc(this.groupCollectionRef, group.id);

        await setDoc(groupRef, groupDataToSave);

        const docSnap = await getDoc(groupRef);
        if (!docSnap.exists()) {
            throw new Error(
                `Failed to read back saved group with ID: ${group.id}`,
            );
        }
        return docSnap.data()!;
    }

    async update(group: Partial<Group>): Promise<Group> {
        if (!group.id) {
            throw new Error("Group ID is required for update operation.");
        }

        try {
            const docRef = this.getGroupDocRef(group.id);

            const updateData: GroupUpdateData = {
                ...group,
                updatedAt: serverTimestamp(),
            };
            await updateDoc(docRef, updateData);

            const updatedGroup = await this.findById(group.id);
            if (!updatedGroup) {
                throw new Error(
                    `Group updated successfully, but failed to retrieve the updated data for ID: ${group.id}`,
                );
            }
            return updatedGroup;
        } catch (error) {
            throw new Error(
                `Failed to update group with ID ${group.id} in Firestore.`,
            );
        }
    }

    async delete(groupId: string): Promise<void> {
        try {
            const docRef = this.getGroupDocRef(groupId);
            await deleteDoc(docRef);
        } catch (error) {
            console.error(`Error deleting group ID ${groupId}:`, error);
            throw new Error(
                `Failed to delete group with ID ${groupId} from Firestore.`,
            );
        }
    } //Clouds Functionで連鎖削除実装予定
}
