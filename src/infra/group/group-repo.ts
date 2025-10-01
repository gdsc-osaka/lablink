import {  doc, getDoc, updateDoc, deleteDoc, collection, getDocs, writeBatch, serverTimestamp, QueryDocumentSnapshot} from 'firebase/firestore';
import {db} from "@/firebase/client";
import { groupConverter } from "./group-converter";
import { Group, GroupRepository } from "@/domain/group";

export class FirestoreGroupRepository implements GroupRepository {
    //Firestoreのコレクション参照
    private get groupCollectionRef() {
        return collection(db, 'groups').withConverter(groupConverter);
    }

    // groups/:groupId ドキュメント参照
    private getGroupDocRef(groupId: string) {
        return doc(this.groupCollectionRef, groupId);
    }

    // users/:userId/groups/:groupId ドキュメント参照
    private getUserGroupDocRef(userId: string, groupId: string) {
        return doc(db, 'users', userId, 'groups', groupId);
    }

    // groups/:groupId/users/:userId ドキュメント参照
    private getGroupUserDocRef(groupId: string, userId: string) {
        return doc(db, 'groups', groupId, 'users', userId);
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
            throw new Error(`Failed to retrieve group with ID ${groupId} from Firestore.`);
        }
    }

    async findAllByUserId(userId: string): Promise<Group[]> {
        try {
            const userGroupsRef = collection(db, 'users', userId, 'groups');
            const userGroupsSnap = await getDocs(userGroupsRef);
            
            if (userGroupsSnap.empty) {
                return [];
            }

            const groupIds = userGroupsSnap.docs.map((doc:QueryDocumentSnapshot) => doc.id);


            const groupsPromises = groupIds.map((id:string) => this.findById(id));
            const groups = await Promise.all(groupsPromises);

            return groups.filter((group:Group): group is Group => group !== null);
        } catch (error) {
            console.error(`Error finding groups for user ${userId}:`, error);
            throw new Error(`Failed to retrieve groups list for user ${userId} from Firestore.`);
        }
    }


    async create(groupData: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Group> {
        try {
            const newGroupRef = doc(this.groupCollectionRef);
            const newGroupId = newGroupRef.id;

            const now = new Date();
            const newGroup: Group = {
                id: newGroupId,
                ...groupData, 
                createdAt: now,
                updatedAt: now,
            };

            const batch = writeBatch(db);

            batch.set(newGroupRef, newGroup);

            const userGroupRef = this.getUserGroupDocRef(userId, newGroupId);
            batch.set(userGroupRef, { joinedAt: serverTimestamp() });

            await batch.commit();

            return newGroup;
        } catch (error) {
            console.error('Error creating group:', error);
            throw new Error('Failed to create the new group in Firestore.');
        }
    }


    async update(group: Partial<Group>): Promise<Group> {
        if (!group.id) {
            throw new Error("Group ID is required for update operation.");
        }
        
        try {
            const docRef = this.getGroupDocRef(group.id);
            
            const updateData: Partial<Group> & { updatedAt: any } = {
                ...group,
                updatedAt: serverTimestamp(),
            };

            await updateDoc(docRef, updateData);

            const updatedGroup = await this.findById(group.id);
            if (!updatedGroup) {
                // 更新は成功したが、直後の読み込みに失敗した場合
                throw new Error(`Group updated successfully, but failed to retrieve the updated data for ID: ${group.id}`);
            }
            
            return updatedGroup;
        } catch (error) {
            console.error(`Error updating group ID ${group.id}:`, error);
            throw new Error(`Failed to update group with ID ${group.id} in Firestore.`);
        }
    }

    async delete(groupId: string): Promise<void> {
        try {
            const docRef = this.getGroupDocRef(groupId);
            await deleteDoc(docRef);
            
            // **重要:**
            // Firestoreはサブコレクションの連鎖削除を自動で行いません。
            // 関連する users/:userId/groups/:groupId ドキュメントや、
            // groups/:groupId/users, /events, /invitations などのサブコレクションの
            // 削除処理は別途実装するか、Cloud Functionsなどで処理する必要があります。
            // ここでは、メインドキュメントの削除のみを実装しています。
        } catch (error) {
            console.error(`Error deleting group ID ${groupId}:`, error);
            throw new Error(`Failed to delete group with ID ${groupId} from Firestore.`);
        }
    }


    async addUserToGroup(groupId: string, userId: string): Promise<void> {
        try {
            const batch = writeBatch(db);
            
            const groupUserRef = this.getGroupUserDocRef(groupId, userId);
            batch.set(groupUserRef, { role: 'member', joinedAt: serverTimestamp() });
            
            const userGroupRef = this.getUserGroupDocRef(userId, groupId);
            batch.set(userGroupRef, { joinedAt: serverTimestamp() });

            await batch.commit();
        } catch (error) {
            console.error(`Error adding user ${userId} to group ${groupId}:`, error);
            throw new Error(`Failed to add user ${userId} to group ${groupId} in Firestore.`);
        }
    }
}

