import { busyToFreeSlots, TimeRange, UserTimeRanges } from "@/domain/calendar";
import { CalendarError, CalendarRepository } from "@/domain/calendar";
import { TokenRepository } from "@/domain/token";
import { ResultAsync } from "neverthrow";

export interface CalendarService {
    fetchFreeSlots: (
        userId: string,
        calendarIds: string[],
        timeMin: Date,
        timeMax: Date,
    ) => ResultAsync<UserTimeRanges, CalendarError>;

    fetchCommonFreeSlots: (
        users: { userId: string; calendarIds: string[] }[],
        timeMin: Date,
        timeMax: Date,
    ) => ResultAsync<TimeRange[], CalendarError>;
}

export const createCalendarService = (
    calendarRepository: CalendarRepository,
    tokenRepository: TokenRepository,
): CalendarService => ({
    fetchFreeSlots: (userId, calendarIds, timeMin, timeMax) =>
        calendarRepository
            .fetchBusySlots(
                userId,
                calendarIds,
                timeMin,
                timeMax,
                tokenRepository,
            )
            .map((busySlots) => ({
                userId: busySlots.userId,
                timeRanges: busyToFreeSlots(
                    busySlots.timeRanges,
                    timeMin,
                    timeMax,
                ),
            })),

    fetchCommonFreeSlots: (users, timeMin, timeMax) => {
        const freeSlotsResult = users.map((user) =>
            calendarRepository.fetchBusySlots(
                user.userId,
                user.calendarIds,
                timeMin,
                timeMax,
                tokenRepository,
            ),
        );

        return ResultAsync.combine(freeSlotsResult).map((freeSlots) =>
            busyToFreeSlots(
                freeSlots.flatMap((user) => user.timeRanges),
                timeMin,
                timeMax,
            ),
        );
    },
});
