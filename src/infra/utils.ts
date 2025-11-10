import { Timestamp } from 'firebase-admin/firestore';

export const toFirestoreTimestamp = (value: Date | Timestamp): Timestamp =>
    value instanceof Timestamp ? value : Timestamp.fromDate(value);
