import { ResultAsync } from "neverthrow";
import { DBError } from "./error";

export const eventTimeOfDays = ["morning", "noon", "evening", "night"] as const;
export type EventTimeOfDay = (typeof eventTimeOfDays)[number];

/**
 * 時間帯ごとのラベルと時刻範囲（JST）の一元定義。
 * UI表示・AIプロンプト生成・スロットフィルタリングすべてがここを参照する。
 * 新しい時間帯を追加する場合は、eventTimeOfDays とこのオブジェクトの両方にエントリを追加すること。
 */
export const EVENT_TIME_OF_DAY_CONFIG: Record<
    EventTimeOfDay,
    { label: string; hours: { start: number; end: number } }
> = {
    morning: { label: "朝（8:00〜12:00ごろ）", hours: { start: 8, end: 12 } },
    noon: { label: "昼（12:00〜15:00ごろ）", hours: { start: 12, end: 15 } },
    evening: { label: "夕（15:00〜18:00ごろ）", hours: { start: 15, end: 18 } },
    night: { label: "夜（18:00〜22:00ごろ）", hours: { start: 18, end: 22 } },
};

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
        event: NewEvent,
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
