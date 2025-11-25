/**
 * Gemini API クライアント
 */

import { ScoredCandidate, ScheduleSuggestion } from "@/domain/ai-suggest";

/**
 * Gemini API にスケジュール提案を依頼
 *
 * @param candidates スコア上位の候補（最大10件程度）
 * @param description イベントの目的・説明
 * @param requiredMemberCount 必須メンバーの総数
 * @returns AI が選んだ上位3件の提案
 */
export async function suggestScheduleWithGemini(
    candidates: ScoredCandidate[],
    description: string,
    requiredMemberCount: number
): Promise<ScheduleSuggestion[]> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    // プロンプト生成
    const prompt = generatePrompt(candidates, description, requiredMemberCount);

    // デバッグ: プロンプト全体をログ出力
    console.log("=== Gemini API Prompt ===");
    console.log(prompt);
    console.log("=========================");

    // Gemini API 呼び出し（最大3回リトライ）
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: prompt,
                                    },
                                ],
                            },
                        ],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 1024,
                        },
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API error: ${response.status} ${errorText}`);
            }

            const data = await response.json();

            // デバッグ: レスポンス全体をログ出力
            console.log("=== Gemini API Response ===");
            console.log(JSON.stringify(data, null, 2));
            console.log("===========================");

            // レスポンスからテキストを抽出
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error("No text response from Gemini API");
            }

            // デバッグ: 抽出されたテキストをログ出力
            console.log("=== Extracted Text ===");
            console.log(text);
            console.log("======================");

            // JSON パース
            const suggestions = parseGeminiResponse(text);

            if (suggestions.length > 0) {
                return suggestions;
            }

            throw new Error("Failed to parse valid suggestions from Gemini response");
        } catch (error) {
            lastError = error as Error;
            console.error(`Gemini API attempt ${attempt} failed:`, error);

            // 最後の試行でなければリトライ
            if (attempt < 3) {
                await sleep(1000 * attempt); // 1秒、2秒と待機時間を増やす
            }
        }
    }

    // 3回失敗したらフォールバック: スコア上位3件をそのまま返す
    console.warn("Falling back to top 3 candidates after Gemini API failures");
    return fallbackSuggestions(candidates.slice(0, 3));
}

/**
 * Gemini 用のプロンプトを生成
 */
function generatePrompt(
    candidates: ScoredCandidate[],
    description: string,
    requiredMemberCount: number
): string {
    const candidatesText = candidates
        .slice(0, 30) // スコア上位30件
        .map((c, idx) => {
            const start = new Date(c.start);
            const end = new Date(c.end);

            // UTCタイムスタンプに9時間（ミリ秒）を加算してJSTに変換
            const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
            const startJST = new Date(start.getTime() + JST_OFFSET_MS);
            const endJST = new Date(end.getTime() + JST_OFFSET_MS);

            // JSTの日時情報を取得（UTCメソッドを使うが、既にJST時刻に変換済み）
            const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][startJST.getUTCDay()];
            const isWeekday = startJST.getUTCDay() >= 1 && startJST.getUTCDay() <= 5;
            const dayType = isWeekday ? "平日" : "休日";

            // 日本時間の文字列を構築（時刻は0埋めなし）
            const startHour = startJST.getUTCHours();
            const startMin = String(startJST.getUTCMinutes()).padStart(2, "0");
            const endHour = endJST.getUTCHours();
            const endMin = String(endJST.getUTCMinutes()).padStart(2, "0");

            const displayDate = `${startJST.getUTCFullYear()}/${String(startJST.getUTCMonth() + 1).padStart(2, "0")}/${String(startJST.getUTCDate()).padStart(2, "0")} ${startHour}:${startMin}`;
            const displayEndDate = `${endJST.getUTCFullYear()}/${String(endJST.getUTCMonth() + 1).padStart(2, "0")}/${String(endJST.getUTCDate()).padStart(2, "0")} ${endHour}:${endMin}`;

            // ISO形式の元データも含める（これは絶対に変更しないでほしい）
            return `候補${idx + 1}: ${displayDate}(${dayOfWeek}) 〜 ${displayEndDate} [${dayType}] (必須${c.requiredMemberCount}/${requiredMemberCount}人, スコア${c.totalScore}) [start:${c.start}, end:${c.end}]`;
        })
        .join("\n");

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

/**
 * Gemini のレスポンステキストから JSON をパース
 */
function parseGeminiResponse(text: string): ScheduleSuggestion[] {
    try {
        // マークダウンのコードブロックを除去
        const jsonText = text
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

        const parsed = JSON.parse(jsonText);

        if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
            throw new Error("Invalid response format: missing suggestions array");
        }

        // 各候補のバリデーション
        const suggestions: ScheduleSuggestion[] = parsed.suggestions
            .slice(0, 3) // 最大3件
            .map((item: any) => {
                if (!item.start || !item.end || !item.reason) {
                    throw new Error("Invalid suggestion format");
                }

                return {
                    start: item.start,
                    end: item.end,
                    reason: item.reason,
                };
            });

        return suggestions;
    } catch (error) {
        console.error("Failed to parse Gemini response:", text, error);
        throw new Error("Failed to parse Gemini response");
    }
}

/**
 * フォールバック: スコア上位候補をそのまま提案として返す
 */
function fallbackSuggestions(candidates: ScoredCandidate[]): ScheduleSuggestion[] {
    return candidates.map(c => ({
        start: c.start,
        end: c.end,
        reason: `参加可能: 必須${c.requiredMemberCount}人、オプション${c.optionalMemberCount}人（Gemini API 失敗のためフォールバック）`,
    }));
}

/**
 * sleep ユーティリティ
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
