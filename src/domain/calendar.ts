import { ResultAsync } from "neverthrow";
import { compareAsc, isAfter, isBefore, max } from "date-fns";
import { TokenError, TokenRepository } from "./token";
import { errorBuilder, InferError } from "obj-err";
import z from "zod";

export interface TimeRange {
    start: Date;
    end: Date;
}

export interface UserTimeRanges {
    userId: string;
    timeRanges: TimeRange[];
}

export const CalendarUnauthenticatedError = errorBuilder(
    "CalendarUnauthenticatedError",
    z.object({
        impl: z.string(),
        userId: z.string(),
    }),
);
export type CalendarUnauthenticatedError = InferError<
    typeof CalendarUnauthenticatedError
>;

export const CalendarPermissionDeniedError = errorBuilder(
    "CalendarPermissionDeniedError",
    z.object({
        impl: z.string(),
        userId: z.string(),
        calendarIds: z.string().array(),
    }),
);
export type CalendarPermissionDeniedError = InferError<
    typeof CalendarPermissionDeniedError
>;

export const CalendarNotFoundError = errorBuilder(
    "CalendarNotFoundError",
    z.object({
        impl: z.string(),
        userId: z.string(),
        calendarIds: z.string().array(),
    }),
);
export type CalendarNotFoundError = InferError<typeof CalendarNotFoundError>;

export const CalendarTooManyRequestsError = errorBuilder(
    "CalendarTooManyRequestsError",
    z.object({
        impl: z.string(),
        userId: z.string(),
    }),
);
export type CalendarTooManyRequestsError = InferError<
    typeof CalendarTooManyRequestsError
>;

export const CalendarUnknownError = errorBuilder(
    "CalendarUnknownError",
    z.object({
        impl: z.string(),
        userId: z.string().optional(),
        calendarIds: z.string().array().optional(),
    }),
);
export type CalendarUnknownError = InferError<typeof CalendarUnknownError>;

export type CalendarError =
    | CalendarNotFoundError
    | CalendarPermissionDeniedError
    | CalendarUnauthenticatedError
    | CalendarTooManyRequestsError
    | TokenError
    | CalendarUnknownError;

/**
 * 予定のリストから空き時間を取得する
 * @param busySlots 予定の時間帯のリスト
 * @param timeMin 取得期間の開始日時
 * @param timeMax 取得期間の終了日時
 * @returns 空き時間帯
 */
export const busyToFreeSlots = (
    busySlots: TimeRange[],
    timeMin: Date,
    timeMax: Date,
): TimeRange[] => {
    if (busySlots.length === 0) {
        return [
            {
                start: timeMin,
                end: timeMax,
            },
        ];
    }

    const sortedBusy: TimeRange[] = busySlots
        .filter(
            (interval) =>
                // 取得期間と重複する予定を対象とする
                interval.start < timeMax && interval.end > timeMin,
        )
        .sort((a, b) => compareAsc(a.start, b.start));

    const mergedBusy: TimeRange[] = [];
    if (sortedBusy.length > 0) {
        let currentMerge = { ...sortedBusy[0] };

        for (let i = 1; i < sortedBusy.length; i++) {
            const nextInterval = sortedBusy[i];
            if (!isAfter(nextInterval.start, currentMerge.end)) {
                currentMerge.end = max([currentMerge.end, nextInterval.end]);
            } else {
                mergedBusy.push(currentMerge);
                currentMerge = { ...nextInterval };
            }
        }
        mergedBusy.push(currentMerge);
    }

    const freeSlots: TimeRange[] = [];
    let lastBusyEnd = timeMin;

    for (const busy of mergedBusy) {
        if (isAfter(busy.start, lastBusyEnd)) {
            freeSlots.push({ start: lastBusyEnd, end: busy.start });
        }
        lastBusyEnd = max([lastBusyEnd, busy.end]);
    }

    if (isBefore(lastBusyEnd, timeMax)) {
        freeSlots.push({ start: lastBusyEnd, end: timeMax });
    }

    return freeSlots;
};

export interface CalendarRepository {
    fetchBusySlots(
        userId: string,
        calendarIds: string[],
        timeMin: Date,
        timeMax: Date,
        tokenRepository: TokenRepository,
    ): ResultAsync<UserTimeRanges, CalendarError>;
}
