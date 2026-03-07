import type {
    DocumentData,
    FirestoreDataConverter,
    QueryDocumentSnapshot,
    SnapshotOptions,
    WithFieldValue,
} from "firebase/firestore";
import type { Invitation } from "@/domain/invitation";
import { toTimestamp } from "@/lib/date";

export const invitationConverter: FirestoreDataConverter<Invitation> = {
    toFirestore(
        modelObject: WithFieldValue<Invitation>,
    ): WithFieldValue<DocumentData> {
        return {
            groupId: modelObject.groupId,
            token: modelObject.token,
<<<<<<< HEAD
            createdAt: toTimestamp(modelObject.createdAt),
            expiresAt: toTimestamp(modelObject.expiresAt),
=======
            status: modelObject.status,
            createdAt: toTimestamp(modelObject.createdAt),
            expiresAt: toTimestamp(modelObject.expiresAt),
            ...(modelObject.usedAt && {
                usedAt: toTimestamp(modelObject.usedAt),
            }),
            ...(modelObject.usedBy && { usedBy: modelObject.usedBy }),
>>>>>>> origin/main
        };
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>,
        options?: SnapshotOptions,
    ): Invitation {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            groupId: data.groupId,
            token: data.token,
<<<<<<< HEAD
            createdAt: data.createdAt.toDate(),
            expiresAt: data.expiresAt.toDate(),
=======
            status: data.status ?? "pending",
            createdAt: data.createdAt.toDate(),
            expiresAt: data.expiresAt.toDate(),
            usedAt: data.usedAt ? data.usedAt.toDate() : undefined,
            usedBy: data.usedBy,
>>>>>>> origin/main
        };
    },
};
