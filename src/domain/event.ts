import { Timestamp } from "firebase/firestore";

export const eventTimeOfDays = ["morning", "noon", "evening", "night"] as const;
export type EventTimeOfDay = (typeof eventTimeOfDays)[number];

export interface Event {
  id?: string;
  title: string;
  description: string;
  begin_at: Timestamp;
  end_at: Timestamp;
  created_at: Date;
  updated_at: Date;
}

export interface SuggestEventData {
  title: string;
  duration: string;
  timezone: string[];
  description: string;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  begin_at: Timestamp;
  end_at: Timestamp;
}

export interface UpdateEventRequest {
  id: string;
  title?: string;
  description?: string;
  begin_at?: Timestamp;
  end_at?: Timestamp;
}

export interface EventRepository {
  findById(groupId: string, id: string): Promise<Event | null>;
  findAll(groupId: string): Promise<Event[]>;
  create(groupId: string, event: CreateEventRequest): Promise<Event>;
  update(groupId: string, event: UpdateEventRequest): Promise<Event>;
  delete(groupId: string, id: string): Promise<void>;
}
