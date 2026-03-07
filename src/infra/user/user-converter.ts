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
<<<<<<< HEAD
=======
            uid: user.uid,
>>>>>>> origin/main
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
<<<<<<< HEAD
            email: data.email ?? snapshot.id,
            created_at: data.created_at,
            updated_at: data.updated_at,
=======
            uid: snapshot.id,
            email: data.email ?? snapshot.id,
            created_at: data.created_at?.toDate() ?? new Date(),
            updated_at: data.updated_at?.toDate() ?? new Date(),
>>>>>>> origin/main
        };
    },
};

export { userConverter };
