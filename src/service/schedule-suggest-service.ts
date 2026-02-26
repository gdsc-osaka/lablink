import "server-only";

import { ResultAsync } from "neverthrow";
import {
    CalendarError,
    CalendarRepository,
    TimeRange,
    UserTimeRanges,
} from "@/domain/calendar";
import { User } from "@/domain/user";
import { createCalendarService } from "./calendar-service";
import { TokenRepository } from "@/domain/token";
import { GenAIError, GenAIRepository } from "@/domain/gen-ai";
import z from "zod";
import { createGenAIService } from "./gen-ai-service";

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
 * イベントの参加者情報
 */
export interface EventMember extends User {
    /** 必須参加者かどうか */
    isRequired: boolean;
}

const MEMBER_REQUIRED_SCORE = 10;
const MEMBER_OPTIONAL_SCORE = 1;

/**
 * 30分スロット
 */
export interface TimeRangeScore {
    /** 時間帯 */
    timeRange: TimeRange;
    /** このスロットで参加可能なメンバー */
    availableMembers: {
        required: User[];
        optional: User[];
    };
    /** スコア */
    score: number;
}

/**
 * 指定された時間帯に、指定された間隔でタイムスロットを作成する。
 * @param timeRange 時間帯
 * @param durationMinutes スロットの長さ（分）
 * @param intervalMinutes スロットの開始時刻の間隔（分）
 * @returns タイムスロット
 *
 * @example
 * createSlots({ start: new Date("2026-02-27T09:00:00"), end: new Date("2026-02-27T12:00:00") }, 60, 30)
 * // [
 * //   { start: new Date("2026-02-27T09:00:00"), end: new Date("2026-02-27T10:00:00") },
 * //   { start: new Date("2026-02-27T09:30:00"), end: new Date("2026-02-27T10:30:00") },
 * //   { start: new Date("2026-02-27T10:00:00"), end: new Date("2026-02-27T11:00:00") },
 * //   { start: new Date("2026-02-27T10:30:00"), end: new Date("2026-02-27T11:30:00") },
 * //   { start: new Date("2026-02-27T11:00:00"), end: new Date("2026-02-27T12:00:00") },
 * // ]
 */
export const createSlots = (
    timeRange: TimeRange,
    durationMinutes: number,
    intervalMinutes: number,
): TimeRange[] => {
    const slots: TimeRange[] = [];
    const slotDurationMs = durationMinutes * 60 * 1000;
    const slotIntervalMs = intervalMinutes * 60 * 1000;

    let currentStart = timeRange.start;

    while (true) {
        const currentEnd = new Date(currentStart.getTime() + slotDurationMs);
        if (currentEnd > timeRange.end) {
            break;
        }

        slots.push({
            start: currentStart,
            end: currentEnd,
        });

        currentStart = new Date(currentStart.getTime() + slotIntervalMs);
    }

    return slots;
};

/**
 * 指定された時間帯の中で、参加可能なメンバーを集計
 *
 * @param timeRange 時間帯
 * @param durationMinutes イベントの所要時間（分）
 * @param memberAvailability メンバーごとの空き時間 Map<userId, freeSlots>
 * @param members メンバー情報
 * @returns スロットごとのスコア
 */
export const calculateTimeRangeScores = (
    timeRange: TimeRange,
    durationMinutes: number,
    memberAvailability: UserTimeRanges[],
    members: EventMember[],
): TimeRangeScore[] => {
    const slots: TimeRangeScore[] = createSlots(
        timeRange,
        durationMinutes,
        30, // TODO: 開始時刻の間隔は 30 分で固定で良いか？
    ).map((slot) => ({
        timeRange: slot,
        availableMembers: {
            required: [],
            optional: [],
        },
        score: 0,
    }));

    for (const availability of memberAvailability) {
        const userFreeSlots = availability.timeRanges;
        const member = members.find((m) => m.id === availability.userId);
        if (!member) continue;

        for (const slot of slots) {
            const slotStartTime = slot.timeRange.start;
            const slotEndTime = slot.timeRange.end;

            // このメンバーがこのスロットで空いているかチェック
            const isAvailable = userFreeSlots.some((freeSlot) => {
                const freeStart = new Date(freeSlot.start);
                const freeEnd = new Date(freeSlot.end);

                // スロット全体がfree期間に含まれているか
                return freeStart <= slotStartTime && slotEndTime <= freeEnd;
            });

            if (isAvailable) {
                if (member.isRequired) {
                    slot.availableMembers.required.push(member);
                    slot.score += MEMBER_REQUIRED_SCORE;
                } else {
                    slot.availableMembers.optional.push(member);
                    slot.score += MEMBER_OPTIONAL_SCORE;
                }
            }
        }
    }

    return slots;
};

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
            const start = new Date(c.timeRange.start);
            const end = new Date(c.timeRange.end);

            // UTCタイムスタンプに9時間（ミリ秒）を加算してJSTに変換
            const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
            const startJST = new Date(start.getTime() + JST_OFFSET_MS);
            const endJST = new Date(end.getTime() + JST_OFFSET_MS);

            // JSTの日時情報を取得（UTCメソッドを使うが、既にJST時刻に変換済み）
            const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][
                startJST.getUTCDay()
            ];
            const isWeekday =
                startJST.getUTCDay() >= 1 && startJST.getUTCDay() <= 5;
            const dayType = isWeekday ? "平日" : "休日";

            // 日本時間の文字列を構築（時刻は0埋めなし）
            const startHour = startJST.getUTCHours();
            const startMin = String(startJST.getUTCMinutes()).padStart(2, "0");
            const endHour = endJST.getUTCHours();
            const endMin = String(endJST.getUTCMinutes()).padStart(2, "0");

            const displayDate = `${startJST.getUTCFullYear()}/${String(startJST.getUTCMonth() + 1).padStart(2, "0")}/${String(startJST.getUTCDate()).padStart(2, "0")} ${startHour}:${startMin}`;
            const displayEndDate = `${endJST.getUTCFullYear()}/${String(endJST.getUTCMonth() + 1).padStart(2, "0")}/${String(endJST.getUTCDate()).padStart(2, "0")} ${endHour}:${endMin}`;

            // ISO形式の元データも含める（これは絶対に変更しないでほしい）
            return `候補${idx + 1}: ${displayDate}(${dayOfWeek}) 〜 ${displayEndDate} [${dayType}] (必須${c.availableMembers.required.length}/${requiredMemberCount}人, スコア${c.score}) [start:${c.timeRange.start.toISOString()}, end:${c.timeRange.end.toISOString()}]`;
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

export interface ScheduleSuggestService {
    /**
     * AI でスケジュール候補を提案する
     * @param description イベントの目的・説明
     * @param scheduleRange 検索対象期間
     * @param eventDurationMinutes イベントの所要時間（分）
     * @param requiredMembers 必須参加者
     * @returns 提案された日程候補（最大3件）
     */
    suggestSchedule(
        description: string,
        scheduleRange: TimeRange,
        eventDurationMinutes: number,
        members: EventMember[],
    ): ResultAsync<ScheduleSuggestion[], CalendarError | GenAIError>;
}

export const createScheduleSuggestService = (
    calendarRepository: CalendarRepository,
    tokenRepository: TokenRepository,
    genAIRepository: GenAIRepository,
): ScheduleSuggestService => {
    const calendarService = createCalendarService(
        calendarRepository,
        tokenRepository,
    );
    const genAIService = createGenAIService(genAIRepository);

    return {
        // TODO: 時間帯による絞り込み (朝・昼・夜など) の機能を削除しているので、今後実装する必要あり
        suggestSchedule: (
            description,
            scheduleRange,
            eventDurationMinutes,
            members,
        ) =>
            ResultAsync.combine(
                members.map((user) =>
                    calendarService.fetchFreeSlots(
                        user.id,
                        [user.id], // TODO: 暫定的にメインのカレンダーのみ取得
                        scheduleRange.start,
                        scheduleRange.end,
                    ),
                ),
            )
                .map((freeSlots) =>
                    calculateTimeRangeScores(
                        scheduleRange,
                        eventDurationMinutes,
                        freeSlots,
                        members,
                    ),
                )
                .andThen((scores) =>
                    genAIService
                        .generateStructured(
                            generatePrompt(
                                scores,
                                description,
                                members.filter((m) => m.isRequired).length,
                            ),
                            z.object({
                                suggestions: z.array(
                                    z.object({
                                        start: z.iso.datetime(),
                                        end: z.iso.datetime(),
                                        reason: z.string(),
                                    }),
                                ),
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
                ),
    };
};
