"use server";

import { googleCalendarRepository } from "@/infra/calendar/google-calendar-repo";
import { googleTokenRepository } from "@/infra/token/google-token-repo";
import {
    createScheduleSuggestionService,
    ScheduleSuggestion,
} from "@/service/schedule-suggestion-service";
import { TimeRange } from "@/domain/calendar";
import { geminiRepo } from "@/infra/ai/gemini-repo";
import { createCalculateFreeTimeService } from "@/service/calculate-free-time-service";
import { EventMember, TimeRangeScore } from "@/domain/schedule-calculator";

export type Result<T, E> =
    | { success: true; data: T }
    | { success: false; error: E };

const calendarRepository = googleCalendarRepository;

const tokenRepository = googleTokenRepository;

/**
 * メンバーの共通の空き時間を計算する
 *
 * @param scheduleRange 検索対象期間
 * @param eventDurationMinutes イベントの所要時間（分）
 * @param members 参加者リスト
 * @returns 計算されたスコア付きの空き時間スロット一覧
 */
export async function calculateFreeTime(
    scheduleRange: TimeRange,
    eventDurationMinutes: number,
    members: EventMember[],
): Promise<Result<TimeRangeScore[], string>> {
    const calculateService = createCalculateFreeTimeService(
        calendarRepository,
        tokenRepository,
    );

    const calcResult = await calculateService.calculateFreeTime(
        scheduleRange,
        eventDurationMinutes,
        members,
    );

    if (calcResult.isErr()) {
        console.warn("Failed to calculate free time:", calcResult.error);
        return { success: false, error: "Failed to calculate free time" };
    }

    return {
        success: true,
        data: calcResult.value,
    };
}

/**
 * AI スケジュール提案のメイン関数
 *
 * @param description イベントの目的・説明
 * @param scores 計算済みの空き時間スコア候補
 * @param requiredMemberCount 必須参加者の数
 * @returns 提案された日程候補（最大3件）
 */
export async function suggestSchedule(
    description: string,
    scores: TimeRangeScore[],
    requiredMemberCount: number,
): Promise<Result<ScheduleSuggestion[], string>> {
    const suggestionService = createScheduleSuggestionService(geminiRepo);

    const suggestionResult = await suggestionService.suggestSchedule(
        description,
        scores,
        requiredMemberCount,
    );

    if (suggestionResult.isErr()) {
        console.warn("Failed to suggest schedule:", suggestionResult.error);
        return { success: false, error: "Failed to suggest schedule" };
    }

    return {
        success: true,
        data: suggestionResult.value,
    };
}
