import {
    FirestoreDataConverter,
    DocumentData,
    QueryDocumentSnapshot,
    SnapshotOptions,
    Timestamp,
} from "firebase/firestore";
import { Event } from "@/domain/event";

export const eventConverter: FirestoreDataConverter<Event> = {
    toFirestore(event: Event): DocumentData {
        return {
            title: event.title,
            description: event.description,
            begin_at: Timestamp.fromDate(event.begin_at),
            end_at: Timestamp.fromDate(event.end_at),
            created_at: Timestamp.fromDate(event.created_at ?? new Date()),
            updated_at: Timestamp.fromDate(event.updated_at ?? new Date()),
        };
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions,
    ): Event {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            title: data.title,
            description: data.description,
            begin_at: data.begin_at.toDate(),
            end_at: data.end_at.toDate(),
            created_at: data.created_at.toDate(),
            updated_at: data.updated_at.toDate(),
        };
    },
};
