import {
    FirestoreDataConverter,
    DocumentData,
    QueryDocumentSnapshot,
    SnapshotOptions,
} from "firebase/firestore";
import { toFirestoreTimestamp } from "@/infra/utils";
import { User } from "@/domain/user";

const userConverter: FirestoreDataConverter<User> = {
    toFirestore(user: User): DocumentData {
        const result: DocumentData = {
            email: user.email,
            created_at: toFirestoreTimestamp(user.created_at),
            updated_at: toFirestoreTimestamp(user.updated_at),
        };

        // Google OAuth トークン管理フィールド
        if (user.google_refresh_token_encrypted !== undefined) {
            result.google_refresh_token_encrypted =
                user.google_refresh_token_encrypted;
        }
        if (user.google_token_expires_at !== undefined) {
            result.google_token_expires_at = toFirestoreTimestamp(
                user.google_token_expires_at,
            );
        }

        return result;
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions,
    ): User {
        const data = snapshot.data(options);

        return {
            email: data.email ?? snapshot.id,
            created_at: data.created_at,
            updated_at: data.updated_at,
            // Google OAuth トークン管理フィールド
            google_refresh_token_encrypted: data.google_refresh_token_encrypted,
            google_token_expires_at: data.google_token_expires_at,
        };
    },
};

export { userConverter };
