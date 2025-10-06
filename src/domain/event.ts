import { Timestamp } from "firebase/firestore";
import { Result } from "neverthrow";
import { DBError } from "./error";

export const eventTimeOfDays = ["morning", "noon", "evening", "night"] as const;
export type EventTimeOfDay = (typeof eventTimeOfDays)[number];

// AI提案前のユーザー入力データ
export interface EventDraft {
  title: string;
  duration: string;
  timeOfDayCandidate: EventTimeOfDay[];
  description: string;
}

// AI提案後の確定データ（Firestore保存用）
export interface Event {
  id?: string;
  title: string;
  description: string;
  begin_at: Timestamp;
  end_at: Timestamp;
  created_at?: Date;
  updated_at?: Date;
}

export interface EventRepository {
  findById: (
    groupId: string,
    id: string,
  ) => Promise<Result<Event | null, DBError>>;
  findAll: (groupId: string) => Promise<Result<Event[], DBError>>;
  create: (groupId: string, event: Event) => Promise<Result<Event, DBError>>;
  update: (groupId: string, event: Event) => Promise<Result<Event, DBError>>;
  delete: (groupId: string, id: string) => Promise<Result<void, DBError>>;
}
