import "server-only";

import { ResultAsync } from "neverthrow";
import { CalendarError, TimeRange } from "@/domain/calendar";
import { GenAIError, GenAIRepository } from "@/domain/gen-ai";
import * as z from "zod";
import { createGenAIService } from "./gen-ai-service";
import { TimeRangeScore } from "@/domain/schedule-calculator";
import { formatToJST } from "@/lib/date";
import { ja } from "date-fns/locale";

/**
 * AI が提案する日程候補
 */
export interface ScheduleSuggestion {
    /** 提案された日程 */
    timeRange: TimeRange;
    /** 提案理由（AIが生成） */
    reason: string;
}

/**
 * Gemini 用のプロンプトを生成
 */
export function generatePrompt(
    candidates: TimeRangeScore[],
    description: string,
    requiredMemberCount: number,
): string {
    const candidatesText = candidates
        .sort((a, b) => b.score - a.score)
        .slice(0, 30) // スコア上位30件
        .map((c, idx) => {
            const start = c.timeRange.start;
            const end = c.timeRange.end;

            // 日本時間（JST, Asia/Tokyo）で日付情報を取得
            const displayDate = formatToJST(start, "yyyy/MM/dd HH:mm");
            const displayEndDate = formatToJST(end, "yyyy/MM/dd HH:mm");

            const dayOfWeek = formatToJST(start, "E", { locale: ja }); // 例: "月", "火", ...
            const isWeekday = ["月", "火", "水", "木", "金"].includes(
                dayOfWeek,
            );
            const dayType = isWeekday ? "平日" : "休日";

            // ISO形式の元データも含める（これは絶対に変更しないでほしい）
            return `候補${idx + 1}: ${displayDate}(${dayOfWeek}) 〜 ${displayEndDate} [${dayType}] (必須${c.availableMemberIds.required.length}/${requiredMemberCount}人, スコア${c.score}) [start:${c.timeRange.start.toISOString()}, end:${c.timeRange.end.toISOString()}]`;
        })
        .join("\n");

    // TODO: AI が ISO 形式の時間を読んで、朝・昼・夜の判別や、時差の考慮をするのは効率が悪くなりそうなので、要検討
    return `You are a schedule coordination AI. Based on the following conditions, select the 3 best schedule candidates.

【Event Purpose & Details】
${description}

【Schedule Candidates】
Note: All displayed times (YYYY/MM/DD HH:MM format) are in JST (Japan Standard Time, UTC+9).
The ISO timestamps in [start:..., end:...] are in UTC.

${candidatesText}

【Selection Criteria】
1. Prioritize candidates where all required members can attend
2. Deeply understand the event's purpose and select appropriate time slots and days
   - Examples: "Welcome party for new students" → evening/night or weekends, "Regular meeting" → weekday daytime, "Lab drinking party" → evening or later
   - If "平日" (weekday) is mentioned, prioritize weekdays; if "休日" (weekend/holiday) is mentioned, prioritize weekends
   - For long-duration events, choose time slots with more flexibility
3. Prioritize candidates with higher scores
4. Select candidates from different dates to provide users with multiple options

【Output Format】
Return the top 3 candidates in the following JSON format:

Important:
- For "start", copy the exact value from [start:...] in the candidate list
- For "end", copy the exact value from [end:...] in the candidate list
- Do NOT modify times or perform timezone conversions
- Write the "reason" field in Japanese
- CRITICAL: Each "reason" must independently explain why THIS time slot fits the event purpose
  - Structure: "[Day of week][Time slot] matches [event requirement], and all required members are available."
  - Example 1: "火曜日の19時は平日夕方で、たこ焼きパーティーに適した時間帯です。全員が参加可能です。"
  - Example 2: "木曜日の14時は平日昼間で、定例ミーティングに最適な時間帯です。必須メンバー全員が参加可能です。"
  - Write each reason as if it is the ONLY suggestion being provided - do not reference other candidates

\`\`\`json
{
  "suggestions": [
    {
      "start": "2025-11-05T10:00:00.000Z",
      "end": "2025-11-05T12:00:00.000Z",
      "reason": "火曜日の19時は平日夕方で、イベントの目的に適した時間帯です。全員が参加可能です。"
    }
  ]
}
\`\`\`

Return ONLY the JSON format above. No other explanations are needed.`;
}

export interface ScheduleSuggestionService {
    /**
     * AI でスケジュール候補を提案する
     * @param description イベントの目的・説明
     * @param scores 計算済みの空き時間スコア候補
     * @param requiredMemberCount 必須参加者の数
     * @returns 提案された日程候補（最大3件）
     */
    suggestSchedule(
        description: string,
        scores: TimeRangeScore[],
        requiredMemberCount: number,
    ): ResultAsync<ScheduleSuggestion[], CalendarError | GenAIError>;
}

export const createScheduleSuggestionService = (
    genAIRepository: GenAIRepository,
): ScheduleSuggestionService => {
    const genAIService = createGenAIService(genAIRepository);

    return {
        // TODO: 時間帯による絞り込み (朝・昼・夜など) の機能を削除しているので、今後実装する必要あり
        suggestSchedule: (description, scores, requiredMemberCount) =>
            genAIService
                .generateStructured(
                    generatePrompt(scores, description, requiredMemberCount),
                    z.object({
                        suggestions: z
                            .array(
                                z.object({
                                    start: z.iso.datetime(),
                                    end: z.iso.datetime(),
                                    reason: z.string(),
                                }),
                            )
                            .min(1)
                            .max(3),
                    }),
                    /* retryCount */ 2,
                )
                .map((result) =>
                    result.suggestions.map((suggestion) => ({
                        timeRange: {
                            start: new Date(suggestion.start),
                            end: new Date(suggestion.end),
                        },
                        reason: suggestion.reason,
                    })),
                ),
    };
};
