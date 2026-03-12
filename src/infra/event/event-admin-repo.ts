import { getFirestoreAdmin } from "@/firebase/admin";
import { handleAdminError } from "@/infra/error-admin";
import { Event, NewEvent } from "@/domain/event";
import { DBError } from "@/domain/error";
import { ResultAsync } from "neverthrow";
import { FieldValue } from "firebase-admin/firestore";

const db = getFirestoreAdmin();

export const firestoreEventAdminRepository = {
    createEvent: (
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
};
