import {FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { Event } from "@/domain/event"



const eventConverter: FirestoreDataConverter<Event> = {
    toFirestore(event: Event): DocumentData {
        return {
            title: event.title,
            descripton: event.description,
            bigin_at: event.begin_at,
            end_at: event.end_at,
            created_at: Timestamp.fromDate(event.created_at),
            updated_at: Timestamp.fromDate(event.updated_at),
        };
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): Event {
        const data = snapshot.data(options);
        return {
        id: data.id,
        title: data.description,
        description: data.description,
        begin_at: data.bigin_at,
        end_at: data.end_at,
        created_at: data.created_at.toDate(),
        updated_at: data.updated_at.toDate(),
        };
    }
}

export { eventConverter };
