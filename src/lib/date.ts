import { format, Locale } from "date-fns";
import { TZDate } from "@date-fns/tz";
import type { FieldValue, WithFieldValue } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";

const TIME_ZONE = "Asia/Tokyo";

/**
 * DateをTimestampに変換する
 * @param date Date, FieldValue, Timestamp, WithFieldValue<Date>
 */
export const toTimestamp = (
    date: Date | Timestamp | FieldValue | WithFieldValue<Date>,
) => (date instanceof Date ? Timestamp.fromDate(date) : date);

/**
 * Dateを指定のフォーマットに変換する
 * @param date Date
 * @param formatStr string
 * @returns string
 */
export const formatToJST = (
    date: Date,
    formatStr: string,
    options?: { locale?: Locale },
) => {
    const tzDate = new TZDate(date, TIME_ZONE);
    return format(tzDate, formatStr, options);
};
