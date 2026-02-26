import { toTimestamp } from "@/lib/date";
import { EncryptedToken, Token } from "@/domain/token";
import {
    DocumentData,
    FieldValue,
    FirestoreDataConverter,
    QueryDocumentSnapshot,
    WithFieldValue,
} from "firebase-admin/firestore";

export const tokenConverter: FirestoreDataConverter<EncryptedToken> = {
    toFirestore(
        modelObject: WithFieldValue<EncryptedToken>,
    ): WithFieldValue<DocumentData> {
        return {
            userId: modelObject.userId,
            encryptedToken: modelObject.encryptedToken,
            createdAt: toTimestamp(modelObject.createdAt),
            updatedAt: FieldValue.serverTimestamp(),
            expiresAt: modelObject.expiresAt
                ? toTimestamp(modelObject.expiresAt)
                : null,
            serviceType: modelObject.serviceType,
        };
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot<DocumentData>,
    ): EncryptedToken {
        const data = snapshot.data();
        return {
            userId: data.userId,
            encryptedToken: data.encryptedToken,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            expiresAt: data.expiresAt?.toDate(),
            serviceType: data.serviceType,
        } as EncryptedToken;
    },
};
