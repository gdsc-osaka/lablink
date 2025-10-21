import {
    FirestoreDataConverter,
    DocumentData,
    QueryDocumentSnapshot,
    SnapshotOptions,
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";

import { User } from "@/domain/user";

const toFirestoreTimestamp = (value: Date | Timestamp): Timestamp =>
    value instanceof Timestamp ? value : Timestamp.fromDate(value);

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
            created_at: data.created_at,
            updated_at: data.updated_at,
        };
    },
};

export { userConverter };
