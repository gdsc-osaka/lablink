import { Timestamp } from "firebase/firestore";

export interface Event {
    id: string;
    title: string;
    description: string;
    begin_at: Timestamp;
    end_at: Timestamp;
    created_at: Date;
    updated_at: Date;
}
