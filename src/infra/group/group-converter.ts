import { Group } from "@/domain/group";
import {
    FirestoreDataConverter,
    DocumentData,
    QueryDocumentSnapshot,
    SnapshotOptions,
    Timestamp,
} from "firebase/firestore";

const groupConverter: FirestoreDataConverter<Group> = {
    toFirestore(group: Group): DocumentData {
        return {
            name: group.name,
            createdAt:
                group.createdAt instanceof Date
                    ? Timestamp.fromDate(group.createdAt)
                    : group.createdAt,
            updatedAt:
                group.updatedAt instanceof Date
                    ? Timestamp.fromDate(group.updatedAt)
                    : group.updatedAt,
        };
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions,
    ): Group {
        const data = snapshot.data(options)!;
        return {
            id: snapshot.id,
            name: data.name,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
        };
    },
};

export { groupConverter };
