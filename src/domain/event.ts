import { ResultAsync } from "neverthrow";
import { DBError } from "./error";

export const eventTimeOfDays = ["morning", "noon", "evening", "night"] as const;
export type EventTimeOfDay = (typeof eventTimeOfDays)[number];

// AI提案前のユーザー入力データ
export interface EventDraft {
    title: string;
    duration: string;
    timeOfDayCandidate: EventTimeOfDay[];
    // 優先参加者をカンマ区切りで表す（例: "alice@example.com,bob@example.com"）
    priorityParticipants?: string;
    description: string;
}

// AI提案後の確定データ（Firestore保存用）
export interface Event {
    id: string;
    title: string;
    description: string;
    begin_at: Date;
    end_at: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface NewEvent {
    title: string;
    description: string;
    begin_at: Date;
    end_at: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface EventRepository {
    getNewEventByGroupAndEventId: (
        groupId: string,
        eventId: string,
    ) => ResultAsync<Event, DBError>;
    getNewEventsByGroupId: (groupId: string) => ResultAsync<Event[], DBError>;
    createNewEvent: (
        groupId: string,
        event: Event,
    ) => ResultAsync<Event, DBError>;
    save: (groupId: string, event: Event) => ResultAsync<Event, DBError>;
    updateNewEvent: (
        groupId: string,
        event: Event,
    ) => ResultAsync<Event, DBError>;
    deleteNewEvent: (
        groupId: string,
        eventId: string,
    ) => ResultAsync<void, DBError>;
}
