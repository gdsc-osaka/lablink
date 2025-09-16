import type { FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions } from "firebase/firestore";

interface Group {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const toTimestamp = (date: Date): Timestamp

const groupConverter: FirestoreDataConverter<Group> = {
  toFirestore(group: Group): DocumentData {
    return {
        name: group.name,
        description: group.description,
        createdAt: group.createdAt instanceof Date ? Timestamp.fromDate(group.createdAt) : group.createdAt,
        updatedAt: group.updatedAt instanceof Date ? Timestamp.fromDate(group.updatedAt) : group.updatedAt,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Group {
    const data = snapshot.data(options);
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  }
};

export { groupConverter };