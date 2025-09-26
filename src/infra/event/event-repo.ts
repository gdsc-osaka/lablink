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
import { db } from "@/firebase/client";
import { eventConverter } from "./event-converter";
import {
  Event,
  EventRepository,
  CreateEventRequest,
  UpdateEventRequest,
} from "@/domain/event";

export class FirestoreEventRepository implements EventRepository {
  async findById(groupId: string, id: string): Promise<Event | null> {
    try {
      const eventDoc = doc(db, "groups", groupId, "events", id).withConverter(
        eventConverter,
      );
      const eventSnap = await getDoc(eventDoc);

      if (!eventSnap.exists()) {
        return null;
      }

      return eventSnap.data();
    } catch (error) {
      console.error("Error finding event by id:", error);
      throw new Error("イベントの取得に失敗しました");
    }
  }

  async findAll(groupId: string): Promise<Event[]> {
    try {
      const eventsRef = collection(
        db,
        "groups",
        groupId,
        "events",
      ).withConverter(eventConverter);
      const q = query(eventsRef, orderBy("created_at", "desc"));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => doc.data());
    } catch (error) {
      console.error("Error finding all events:", error);
      throw new Error("イベント一覧の取得に失敗しました");
    }
  }

  async create(groupId: string, eventData: CreateEventRequest): Promise<Event> {
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

      return {
        ...event,
        id: docRef.id,
      } as Event;
    } catch (error) {
      console.error("Error creating event:", error);
      throw new Error("イベントの作成に失敗しました");
    }
  }

  async update(groupId: string, eventData: UpdateEventRequest): Promise<Event> {
    try {
      const { id, ...updateData } = eventData;
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
      const updatedEvent = await this.findById(groupId, id);
      if (!updatedEvent) {
        throw new Error("更新されたイベントが見つかりません");
      }

      return updatedEvent;
    } catch (error) {
      console.error("Error updating event:", error);
      throw new Error("イベントの更新に失敗しました");
    }
  }

  async delete(groupId: string, id: string): Promise<void> {
    try {
      const eventRef = doc(db, "groups", groupId, "events", id);
      await deleteDoc(eventRef);
    } catch (error) {
      console.error("Error deleting event:", error);
      throw new Error("イベントの削除に失敗しました");
    }
  }
}
