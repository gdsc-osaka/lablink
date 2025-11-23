import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    serverTimestamp,
    FieldValue,
    Timestamp,
    WithFieldValue,
    DocumentReference,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import { groupConverter } from "./group-converter";
import { Group, GroupRepository } from "@/domain/group";
import { ok, err, ResultAsync, errAsync } from "neverthrow";
import { DBError, UnknownError, NotFoundError } from "@/domain/error";
import { handleFirestoreError } from "../error";

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

export const firestoreGroupRepository: GroupRepository = {
    findById: (groupId: string): ResultAsync<Group, DBError> => {
        const docRef = doc(db, "groups", groupId).withConverter(groupConverter);

        return ResultAsync.fromPromise(
            getDoc(docRef),
            handleFirestoreError,
        ).andThen((docSnap) => {
            if (!docSnap.exists()) {
                return err(
                    NotFoundError(`Group not found: ${groupId}`, { extra: {} }),
                );
            }
            return ok(docSnap.data());
        });
    },

    save: (group: Group, _userId: string): ResultAsync<Group, DBError> => {
        const groupDataToSave: WithFieldValue<GroupForDb> = {
            ...group,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const groupRef = doc(
            db,
            "groups",
            group.id,
        ) as DocumentReference<GroupForDb>;

        return ResultAsync.fromPromise(
            setDoc(groupRef, groupDataToSave),
            handleFirestoreError,
        ).map(() => group);
    },

    update: (group: Partial<Group>): ResultAsync<Group, DBError> => {
        if (!group.id) {
            return errAsync(
                UnknownError("Group ID is required for update operation.", {
                    extra: {},
                }),
            );
        }

        const docRef = doc(db, "groups", group.id).withConverter(
            groupConverter,
        );
        const updateData: WithFieldValue<GroupUpdateData> = {
            ...group,
            updatedAt: serverTimestamp(),
        };

        return ResultAsync.fromPromise(
            updateDoc(docRef, updateData),
            handleFirestoreError,
        ).andThen(() => firestoreGroupRepository.findById(group.id!));
    },

    delete: (groupId: string): ResultAsync<void, DBError> => {
        const docRef = doc(db, "groups", groupId);
        return ResultAsync.fromPromise(
            deleteDoc(docRef),
            handleFirestoreError,
        ).map(() => undefined);
    },
};
