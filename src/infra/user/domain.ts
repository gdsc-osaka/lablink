import type { FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions } from "firebase/firestore";

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const toTimestamp = (date: Date): Timestamp

const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: User): DocumentData {
    return {
        name: user.name,
        email: user.email,
        createdAt: user.createdAt instanceof Date ? Timestamp.fromDate(user.createdAt) : user.createdAt,
        updatedAt: user.updatedAt instanceof Date ? Timestamp.fromDate(user.updatedAt) : user.updatedAt,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): User {
    const data = snapshot.data(options);
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  }
};

export { userConverter };