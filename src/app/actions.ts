"use server";

import { googleCalendarRepository } from "@/infra/calendar/google-calendar-repo";
import { googleTokenRepository } from "@/infra/token/google-token-repo";
import {
    createScheduleSuggestService,
    EventMember,
    ScheduleSuggestion,
} from "@/service/schedule-suggest-service";
import { TimeRange } from "@/domain/calendar";
import { geminiRepo } from "@/infra/ai/gemini-repo";

export type Result<T, E> =
    | { success: true; data: T }
    | { success: false; error: E };

const calendarRepository = googleCalendarRepository;

const tokenRepository = googleTokenRepository;

/**
 * AI スケジュール提案のメイン関数
 *
 * @param request SuggestScheduleRequest
 * @returns SuggestScheduleResponse
 */
export async function suggestSchedule(
    description: string,
    scheduleRange: TimeRange,
    eventDurationMinutes: number,
    members: EventMember[],
): Promise<Result<ScheduleSuggestion[], string>> {
    const suggestScheduleService = createScheduleSuggestService(
        calendarRepository,
        tokenRepository,
        geminiRepo,
    );

    const suggestionResult = await suggestScheduleService.suggestSchedule(
        description,
        scheduleRange,
        eventDurationMinutes,
        members,
    );

    if (suggestionResult.isErr()) {
        console.warn("Failed to suggest schedule:", suggestionResult.error);
        return {
            success: false,
            error:
                "Failed to suggest schedule: " + suggestionResult.error.message,
        };
    }

    return {
        success: true,
        data: suggestionResult.value,
    };
}
