import "server-only";

import { ResultAsync } from "neverthrow";
import { EventTimeOfDay, EVENT_TIME_OF_DAY_CONFIG } from "@/domain/event";
import { GenAIError, GenAIRepository } from "@/domain/gen-ai";
import {
    SchedulePreference,
    SchedulePreferenceSchema,
} from "@/domain/schedule-calculator";
import { createGenAIService } from "./gen-ai-service";

export interface SchedulePreferenceService {
    /**
     * イベント内容とUI指定時間帯から、曜日・時間帯の希望条件を抽出する
     * 失敗時のpreferenceなしフォールバックは呼び出し側で行う
     * @param description イベントの目的・説明
     * @param timeOfDayCandidates UIで選択された希望時間帯
     * @returns スケジュール希望条件
     */
    extractPreference(
        description: string,
        timeOfDayCandidates: EventTimeOfDay[],
    ): ResultAsync<SchedulePreference, GenAIError>;
}

export function generateSchedulePreferencePrompt(
    description: string,
    timeOfDayCandidates: EventTimeOfDay[],
): string {
    const validTimeOfDayCandidates = timeOfDayCandidates.filter(
        (timeOfDay): timeOfDay is EventTimeOfDay =>
            timeOfDay in EVENT_TIME_OF_DAY_CONFIG,
    );

    const timeOfDayText =
        validTimeOfDayCandidates.length > 0
            ? validTimeOfDayCandidates
                  .map((timeOfDay) => {
                      const config = EVENT_TIME_OF_DAY_CONFIG[timeOfDay];
                      return `- ${config.label}: JST ${config.hours.start}:00-${config.hours.end}:00`;
                  })
                  .join("\n")
            : "- 指定なし";

    return `You are a schedule preference extraction AI.
Extract preferred days of week and preferred JST hour ranges from the event description and UI-selected time ranges.

【Event Description】
${description}

【UI-selected Time Ranges】
${timeOfDayText}

【Rules】
- Treat UI-selected time ranges as strong constraints for preference extraction.
- Do not return hour ranges that greatly differ from UI-selected time ranges unless the UI selection is empty.
- For example, if the UI-selected time range is "昼（12:00〜15:00ごろ）", do not return 19:00-22:00 only because the event sounds like a drinking party.
- Use JST hours.
- Each hour range must satisfy startHour < endHour.
- If an overnight range is needed, split it into separate ranges such as 22-24 and 0-2.
- Write all "reason" and "summary" values in Japanese.
- Do not include numeric score weights. The application decides scoring later.
- Return only JSON matching the schema.`;
}

export const createSchedulePreferenceService = (
    genAIRepository: GenAIRepository,
): SchedulePreferenceService => {
    const genAIService = createGenAIService(genAIRepository);

    return {
        extractPreference: (description, timeOfDayCandidates) =>
            genAIService.generateStructured(
                generateSchedulePreferencePrompt(
                    description,
                    timeOfDayCandidates,
                ),
                SchedulePreferenceSchema,
                /* retryCount */ 2,
            ),
    };
};
