import { busyToFreeSlots, TimeRange, UserTimeRanges } from "@/domain/calendar";
import { CalendarError, CalendarRepository } from "@/domain/calendar";
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
): CalendarService => ({
    fetchFreeSlots: (userId, calendarIds, timeMin, timeMax) =>
        calendarRepository
            .fetchBusySlots(userId, calendarIds, timeMin, timeMax)
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
