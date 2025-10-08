import type { FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions } from "firebase/firestore";

interface Invitation {
  id: string;
  groupid: string;
  token: string;
  createdAt: Date;
  updatedAt: Date;
}

const toTimestamp = (date: Date): Timestamp

const invitationConverter: FirestoreDataConverter<Invitation> = {
  toFirestore(invitation: Invitation): DocumentData {
    return {
        grounpid: invitation.groupid,
        token: invitation.token,
        createdAt: invitation.createdAt instanceof Date ? Timestamp.fromDate(invitation.createdAt) : invitation.createdAt,
        updatedAt: invitation.updatedAt instanceof Date ? Timestamp.fromDate(invitation.updatedAt) : invitation.updatedAt,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Invitation {
    const data = snapshot.data(options);
    return {
      id: data.id,
      groupid: data.grounpid,
      token: data.token,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  }
};

export { invitationConverter };