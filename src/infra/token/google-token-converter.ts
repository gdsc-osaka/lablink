import { EncryptedToken } from "@/domain/token";
import {
    DocumentData,
    FieldValue,
    FirestoreDataConverter,
    QueryDocumentSnapshot,
    Timestamp,
    WithFieldValue,
} from "firebase-admin/firestore";

export const tokenConverter: FirestoreDataConverter<EncryptedToken> = {
    toFirestore(
        modelObject: WithFieldValue<EncryptedToken>,
    ): WithFieldValue<DocumentData> {
        return {
            userId: modelObject.userId,
            encryptedToken: modelObject.encryptedToken,
            createdAt:
                modelObject.createdAt instanceof Date
                    ? Timestamp.fromDate(modelObject.createdAt)
                    : modelObject.createdAt,
            updatedAt: FieldValue.serverTimestamp(),
            expiresAt:
                modelObject.expiresAt instanceof Date
                    ? Timestamp.fromDate(modelObject.expiresAt)
                    : (modelObject.expiresAt ?? null),
            serviceType: modelObject.serviceType,
        };
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot<DocumentData>,
    ): EncryptedToken {
        const data = snapshot.data();

        if (typeof data.userId !== "string" || data.userId.trim() === "") {
            throw new Error(
                `Malformed document: userId is missing or invalid for token ${snapshot.id}`,
            );
        }
        if (
            typeof data.encryptedToken !== "string" ||
            data.encryptedToken === ""
        ) {
            throw new Error(
                `Malformed document: encryptedToken is missing or invalid for token ${snapshot.id}`,
            );
        }
        if (
            typeof data.serviceType !== "string" ||
            data.serviceType.trim() === ""
        ) {
            throw new Error(
                `Malformed document: serviceType is missing or invalid for token ${snapshot.id}`,
            );
        }
        if (!data.createdAt || typeof data.createdAt.toDate !== "function") {
            throw new Error(
                `Malformed document: createdAt is missing or invalid for token ${snapshot.id}`,
            );
        }
        if (!data.updatedAt || typeof data.updatedAt.toDate !== "function") {
            throw new Error(
                `Malformed document: updatedAt is missing or invalid for token ${snapshot.id}`,
            );
        }

        return {
            userId: data.userId,
            encryptedToken: data.encryptedToken,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            expiresAt:
                data.expiresAt && typeof data.expiresAt.toDate === "function"
                    ? data.expiresAt.toDate()
                    : null,
            serviceType: data.serviceType,
        } as EncryptedToken;
    },
};
