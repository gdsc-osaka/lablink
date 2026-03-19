import { getFirestoreAdmin } from "@/firebase/admin";
import { handleAdminError } from "@/infra/error-admin";
import { Event, NewEvent, EventRepository } from "@/domain/event";
import { DBError, NotFoundError } from "@/domain/error";
import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { FieldValue } from "firebase-admin/firestore";

const db = getFirestoreAdmin();

export const firestoreEventAdminRepository: EventRepository = {
    createNewEvent: (
        groupId: string,
        eventData: NewEvent,
    ): ResultAsync<Event, DBError> => {
        const eventsRef = db
            .collection("groups")
            .doc(groupId)
            .collection("events");

        const docData = {
            title: eventData.title,
            description: eventData.description,
            begin_at: eventData.begin_at,
            end_at: eventData.end_at,
            created_at: FieldValue.serverTimestamp(),
            updated_at: FieldValue.serverTimestamp(),
        };

        return ResultAsync.fromPromise(
            eventsRef.add(docData),
            handleAdminError,
        ).map((docRef) => ({
            ...eventData,
            id: docRef.id,
            created_at: new Date(),
            updated_at: new Date(),
        }));
    },
    getNewEventsByGroupId: (groupId: string): ResultAsync<Event[], DBError> => {
        const eventsRef = db
            .collection("groups")
            .doc(groupId)
            .collection("events");

        return ResultAsync.fromPromise(
            eventsRef.orderBy("created_at", "desc").get(),
            handleAdminError,
        ).andThen((querySnapshot) => {
            const events: Event[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                events.push({
                    id: doc.id,
                    title: data.title,
                    description: data.description,
                    begin_at: data.begin_at?.toDate(),
                    end_at: data.end_at?.toDate(),
                    created_at: data.created_at?.toDate(),
                    updated_at: data.updated_at?.toDate(),
                });
            });
            if (events.length === 0) {
                return errAsync(NotFoundError("No events found"));
            }
            return okAsync(events);
        });
    },
    getNewEventByGroupAndEventId: (
        groupId: string,
        eventId: string,
    ): ResultAsync<Event, DBError> => {
        return errAsync(
            NotFoundError("getNewEventByGroupAndEventId not implemented for admin repo"),
        );
    },
    save: (groupId: string, eventData: Event): ResultAsync<Event, DBError> => {
        return errAsync(NotFoundError("save not implemented for admin repo"));
    },
    updateNewEvent: (
        groupId: string,
        eventData: Event,
    ): ResultAsync<Event, DBError> => {
        return errAsync(
            NotFoundError("updateNewEvent not implemented for admin repo"),
        );
    },
    deleteNewEvent: (
        groupId: string,
        eventId: string,
    ): ResultAsync<void, DBError> => {
        return errAsync(
            NotFoundError("deleteNewEvent not implemented for admin repo"),
        );
    },
};
