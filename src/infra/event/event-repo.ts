import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
    WithFieldValue,
} from "firebase/firestore";
import { ok, err, ResultAsync, errAsync } from "neverthrow";
import { db } from "@/firebase/client";
import { eventConverter } from "./event-converter";
import { Event, EventRepository, NewEvent } from "@/domain/event";
import { handleFirestoreError } from "@/infra/error";
import { DBError, NotFoundError } from "@/domain/error";

export const firestoreEventRepository: EventRepository = {
    findById: (
        groupId: string,
        id: string,
    ): ResultAsync<Event, DBError> => {
        const eventDoc = doc(
            db,
            "groups",
            groupId,
            "events",
            id,
        ).withConverter(eventConverter);

        return ResultAsync.fromPromise(
            getDoc(eventDoc),
            handleFirestoreError,
        ).andThen((eventSnap) => {
            if (!eventSnap.exists()) {
                return err(NotFoundError("Event not found"));
            }
            const data = eventSnap.data();

            return ok(data as Event);
        });
    },

    findAll: (groupId: string): ResultAsync<Event[], DBError> => {
        const eventsRef = collection(
            db,
            "groups",
            groupId,
            "events",
        ).withConverter(eventConverter);
        const q = query(eventsRef, orderBy("created_at", "desc"));

        return ResultAsync.fromPromise(
            getDocs(q),
            handleFirestoreError,
        ).andThen((querySnapshot) => {
            const events: Event[] = [];
            querySnapshot.forEach((doc) => {
                events.push(doc.data());
            });
            if (events.length === 0) {
                return err(NotFoundError("No events found"));
            }
            return ok(events);
        });
    },

    create: (
        groupId: string,
        eventData: NewEvent,
    ): ResultAsync<Event, DBError> => {
        const event: WithFieldValue<NewEvent> = {
            ...eventData,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
        };

        const eventsRef = collection(
            db,
            "groups",
            groupId,
            "events",
        ).withConverter(eventConverter);

        return ResultAsync.fromPromise(
            addDoc(eventsRef, event),
            handleFirestoreError,
        ).map((docRef) => ({
            ...eventData,
            id: docRef.id,
            created_at: new Date(),
            updated_at: new Date(),
        }));
    },

    update: (
        groupId: string,
        eventData: Event,
    ): ResultAsync<Event, DBError> => {
        const { id, ...updateData } = eventData;
        if (!id) {
            return errAsync(
                handleFirestoreError(
                    new Error("イベントIDが指定されていません"),
                ),
            );
        }

        const eventRef = doc(
            db,
            "groups",
            groupId,
            "events",
            id,
        ).withConverter(eventConverter);

        const updatePayload: WithFieldValue<Partial<Event>> = {
            ...updateData,
            updated_at: serverTimestamp(),
        };

        return ResultAsync.fromPromise(
            updateDoc(eventRef, updatePayload),
            handleFirestoreError,
        ).andThen(() => firestoreEventRepository.findById(groupId, id));
    },

    delete: (
        groupId: string,
        id: string,
    ): ResultAsync<void, DBError> => {
        const eventRef = doc(db, "groups", groupId, "events", id);

        return ResultAsync.fromPromise(
            deleteDoc(eventRef),
            handleFirestoreError,
        ).map(() => undefined);
    },
};
