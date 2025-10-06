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
} from "firebase/firestore";
import { Result, ok, err } from "neverthrow";
import { db } from "@/firebase/client";
import { eventConverter } from "./event-converter";
import { Event, EventRepository } from "@/domain/event";
import { handleFirestoreError } from "@/infra/error";
import { DBError } from "@/domain/error";

export const firestoreEventRepository: EventRepository = {
  findById: async (
    groupId: string,
    id: string,
  ): Promise<Result<Event | null, DBError>> => {
    try {
      const eventDoc = doc(db, "groups", groupId, "events", id).withConverter(
        eventConverter,
      );
      const eventSnap = await getDoc(eventDoc);

      if (!eventSnap.exists()) {
        return ok(null);
      }

      return ok(eventSnap.data());
    } catch (error) {
      console.error("Error finding event by id:", error);
      return err(handleFirestoreError(error));
    }
  },

  findAll: async (groupId: string): Promise<Result<Event[], DBError>> => {
    try {
      const eventsRef = collection(
        db,
        "groups",
        groupId,
        "events",
      ).withConverter(eventConverter);
      const q = query(eventsRef, orderBy("created_at", "desc"));
      const querySnapshot = await getDocs(q);

      return ok(querySnapshot.docs.map((doc) => doc.data()));
    } catch (error) {
      console.error("Error finding all events:", error);
      return err(handleFirestoreError(error));
    }
  },

  create: async (
    groupId: string,
    eventData: Event,
  ): Promise<Result<Event, DBError>> => {
    try {
      const now = new Date();
      const event: Omit<Event, "id"> = {
        ...eventData,
        created_at: now,
        updated_at: now,
      };

      const eventsRef = collection(
        db,
        "groups",
        groupId,
        "events",
      ).withConverter(eventConverter);
      const docRef = await addDoc(eventsRef, event);

      return ok({
        ...event,
        id: docRef.id,
      } as Event);
    } catch (error) {
      console.error("Error creating event:", error);
      return err(handleFirestoreError(error));
    }
  },

  update: async (
    groupId: string,
    eventData: Event,
  ): Promise<Result<Event, DBError>> => {
    try {
      const { id, ...updateData } = eventData;
      if (!id) {
        return err(
          handleFirestoreError(new Error("イベントIDが指定されていません")),
        );
      }
      const eventRef = doc(db, "groups", groupId, "events", id).withConverter(
        eventConverter,
      );

      const now = new Date();
      const updatePayload = {
        ...updateData,
        updated_at: now,
      };

      await updateDoc(eventRef, updatePayload);

      // 更新後のデータを取得して返す
      const updatedEventResult = await firestoreEventRepository.findById(
        groupId,
        id,
      );
      if (updatedEventResult.isErr()) {
        return err(updatedEventResult.error);
      }

      const updatedEvent = updatedEventResult.value;
      if (!updatedEvent) {
        return err(
          handleFirestoreError(new Error("更新されたイベントが見つかりません")),
        );
      }

      return ok(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      return err(handleFirestoreError(error));
    }
  },

  delete: async (
    groupId: string,
    id: string,
  ): Promise<Result<void, DBError>> => {
    try {
      const eventRef = doc(db, "groups", groupId, "events", id);
      await deleteDoc(eventRef);
      return ok(undefined);
    } catch (error) {
      console.error("Error deleting event:", error);
      return err(handleFirestoreError(error));
    }
  },
};
