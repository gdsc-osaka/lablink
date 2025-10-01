import { Timestamp } from "firebase/firestore";

export const eventTimeOfDays = ["morning", "noon", "evening", "night"] as const;
export type EventTimeOfDay = (typeof eventTimeOfDays)[number];

export interface Event {
    id: string;
    title: string;
    description: string;
    begin_at: Timestamp;
    end_at: Timestamp;
    created_at: Date;
    updated_at: Date;
}
