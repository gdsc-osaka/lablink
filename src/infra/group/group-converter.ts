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

// Admin SDK用の変換ユーティリティ
export const toGroupFromAdmin = (
    docId: string,
    data: FirebaseFirestore.DocumentData,
): Group => {
    return {
        id: docId,
        name: data.name || "Unknown Group",
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
    };
};

export { groupConverter };
