import { getFirestoreAdmin } from "@/firebase/admin";
import { Group, GroupRepository } from "@/domain/group";
import { DBError, NotFoundError, UnknownError } from "@/domain/error";
import { ResultAsync, err, errAsync, ok } from "neverthrow";
import { FieldValue } from "firebase-admin/firestore";
import { handleAdminError } from "@/infra/error-admin";

const db = getFirestoreAdmin();

const toGroup = (docId: string, data: FirebaseFirestore.DocumentData): Group => {
    return {
        id: docId,
        name: data.name,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
    };
};

export const firestoreGroupAdminRepository: GroupRepository = {
    findById: (groupId: string): ResultAsync<Group, DBError> => {
        const docRef = db.collection("groups").doc(groupId);

        return ResultAsync.fromPromise(
            docRef.get(),
            handleAdminError,
        ).andThen((docSnap) => {
            if (!docSnap.exists) {
                return err(NotFoundError(`Group not found: ${groupId}`));
            }
            return ok(toGroup(docSnap.id, docSnap.data()!));
        });
    },

    save: (group: Group, _userId: string): ResultAsync<Group, DBError> => {
        const groupData: FirebaseFirestore.DocumentData = {
            name: group.name,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        const docRef = db.collection("groups").doc(group.id);

        return ResultAsync.fromPromise(
            docRef.set(groupData),
            handleAdminError,
        ).map(() => group);
    },

    update: (group: Partial<Group>): ResultAsync<Group, DBError> => {
        if (!group.id) {
            return errAsync(
                UnknownError("Group ID is required for update operation.", {}),
            );
        }

        const docRef = db.collection("groups").doc(group.id);
        const updateData: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
            ...group,
            updatedAt: FieldValue.serverTimestamp(),
        };

        return ResultAsync.fromPromise(
            docRef.update(updateData),
            handleAdminError,
        ).andThen(() => firestoreGroupAdminRepository.findById(group.id!));
    },

    delete: (groupId: string): ResultAsync<void, DBError> => {
        const docRef = db.collection("groups").doc(groupId);
        return ResultAsync.fromPromise(
            docRef.delete(),
            handleAdminError,
        ).map(() => undefined);
    },
};
