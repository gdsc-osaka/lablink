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
        return {
            email: user.email,
            created_at: toFirestoreTimestamp(user.created_at),
            updated_at: toFirestoreTimestamp(user.updated_at),
        };
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions,
    ): User {
        const data = snapshot.data(options);

        return {
            email: data.email ?? snapshot.id,
            // サーバーとクライアントでTimestampの型が違う可能性があるため注意
            // ここでは簡易的に存在チェックのみを行う
            created_at: data.created_at || new Date(),
            updated_at: data.updated_at || new Date(),
        };
    },
};

export { userConverter };
