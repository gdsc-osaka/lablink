import "server-only";

import { ResultAsync } from "neverthrow";
import {
    CalendarError,
    CalendarRepository,
    TimeRange,
} from "@/domain/calendar";
import { TokenRepository } from "@/domain/token";
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
        allowedHourRanges?: { start: number; end: number }[],
    ): ResultAsync<TimeRangeScore[], CalendarError>;
}

export const createCalculateFreeTimeService = (
    calendarRepository: CalendarRepository,
    tokenRepository: TokenRepository,
): CalculateFreeTimeService => {
    const calendarService = createCalendarService(
        calendarRepository,
        tokenRepository,
    );

    return {
        calculateFreeTime: (
            scheduleRange,
            eventDurationMinutes,
            members,
            allowedHourRanges,
        ) =>
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
                    // slotIntervalMinutes: undefined を渡して calculateTimeRangeScores の
                    // デフォルト値（30分刻み）を使用。
                    // TODO: 現状は30分固定だが、以下の方法で柔軟化を検討できる:
                    //   案A: EventDraft に slotIntervalMinutes フィールドを追加し、UIから指定できるようにする
                    //   案B: イベントの所要時間(eventDurationMinutes)に応じて自動調整する
                    //        （例: 2時間以上なら60分刻み、30分未満なら15分刻み）
                    //   案C: 現状の30分固定のまま運用し、必要になったときに対応する
                    undefined,
                    allowedHourRanges,
                ),
            ),
    };
};
