import "server-only";

import { ResultAsync } from "neverthrow";
import {
    CalendarError,
    CalendarRepository,
    TimeRange,
} from "@/domain/calendar";
import { createCalendarService } from "./calendar-service";
import {
    calculateTimeRangeScores,
    EventMember,
    TimeRangeScore,
} from "@/domain/schedule-calculator";

export interface CalculateFreeTimeService {
    /**
     * 指定されたメンバー全員のカレンダーを取得し、共通の空き時間を計算して返す
     * @param scheduleRange 検索対象期間
     * @param eventDurationMinutes イベントの所要時間（分）
     * @param members 参加者リスト（必須・任意の区別を含む）
     * @returns 計算されたスコア付きの空き時間スロット一覧
     */
    calculateFreeTime(
        scheduleRange: TimeRange,
        eventDurationMinutes: number,
        members: EventMember[],
    ): ResultAsync<TimeRangeScore[], CalendarError>;
}

export const createCalculateFreeTimeService = (
    calendarRepository: CalendarRepository,
): CalculateFreeTimeService => {
    const calendarService = createCalendarService(calendarRepository);

    return {
        calculateFreeTime: (scheduleRange, eventDurationMinutes, members) =>
            ResultAsync.combine(
                members.map((user) =>
                    calendarService.fetchFreeSlots(
                        user.uid,
                        [user.email], // TODO: 暫定的にメインのカレンダーのみ取得
                        scheduleRange.start,
                        scheduleRange.end,
                    ),
                ),
            ).map((freeSlots) =>
                calculateTimeRangeScores(
                    scheduleRange,
                    eventDurationMinutes,
                    freeSlots,
                    members,
                ),
            ),
    };
};
