import { format, utcToZonedTime } from "date-fns-tz";
import type { FieldValue, WithFieldValue } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";

const TIME_ZONE = "Asia/Tokyo";

/**
 * タイムゾーンを考慮した現在時刻を取得する
 * @returns {Date}
 */
export const zonedCurrentDate = () => utcToZonedTime(new Date(), TIME_ZONE);

/**
 * DateをTimestampに変換する
 * @param date Date, FieldValue, Timestamp, WithFieldValue<Date>
 */
export const toTimestamp = (
    date: Date | Timestamp | FieldValue | WithFieldValue<Date>,
) => (date instanceof Date ? Timestamp.fromDate(date) : date);

/**
 * 日付をフォーマットする
 * @param date Date
 * @param formatStr string
 * @returns {string}
 */
export const formatDate = (date: Date, formatStr: string): string => {
    const zonedDate = utcToZonedTime(date, TIME_ZONE);
    return format(zonedDate, formatStr, { timeZone: TIME_ZONE });
};
