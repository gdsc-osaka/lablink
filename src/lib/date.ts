import type { FieldValue, WithFieldValue } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";

/**
 * DateをTimestampに変換する
 * @param date Date, FieldValue, Timestamp, WithFieldValue<Date>
 */
export const toTimestamp = (
    date: Date | Timestamp | FieldValue | WithFieldValue<Date>,
) => (date instanceof Date ? Timestamp.fromDate(date) : date);
