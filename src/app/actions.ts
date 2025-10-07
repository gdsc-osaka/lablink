"use server";

import { google } from "googleapis";
import { findCommonFreeSlots } from "@/lib/availability";
import { formatFreeSlotsForAI } from "@/lib/ai-formatter";
// import { callGeminiAPI } from '@/lib/gemini'; // 将来的にGemini APIを呼び出す関数

// APIからの戻り値の型
interface TimeSlot {
    start: string;
    end: string;
}
interface CommonAvailabilityResponse {
    success: boolean;
    message: string;
    data: string; // Geminiに渡すために整形された文字列
}

export async function getCommonAvailability(
    accessToken: string,
    userEmails: string[],
    timeMin: string,
    timeMax: string,
): Promise<CommonAvailabilityResponse> {
    if (!accessToken) {
        throw new Error("Access token is required.");
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    try {
        // 1. 複数ユーザーの予定（busy）情報を一括で取得
        const freeBusyResponse = await calendar.freebusy.query({
            requestBody: {
                timeMin: timeMin,
                timeMax: timeMax,
                timeZone: "Asia/Tokyo",
                items: userEmails.map((email) => ({ id: email })),
            },
        });

        const calendarsBusyInfo = freeBusyResponse.data.calendars;
        if (!calendarsBusyInfo) {
            return {
                success: true,
                message: "No calendar information was returned from the API.",
                data: formatFreeSlotsForAI([]),
            };
        }

        // 2. 全員の「予定あり」の時間帯を一つの配列にまとめる
        const busyIntervals: TimeSlot[] = [];
        Object.values(calendarsBusyInfo).forEach((calendarInfo) => {
            if (calendarInfo.busy) {
                const validBusySlots = calendarInfo.busy.filter(
                    (period): period is TimeSlot =>
                        !!period.start && !!period.end,
                );
                busyIntervals.push(...validBusySlots);
            }
        });

        // 3. 共通の空き時間を計算
        const freeSlots = findCommonFreeSlots(busyIntervals, timeMin, timeMax);

        // 4. Gemini APIに渡すためにデータを整形
        const formattedFreeSlots = formatFreeSlotsForAI(freeSlots);

        console.log("Formatted text to be sent to Gemini:", formattedFreeSlots);

        // 5. 整形した文字列をGemini APIに渡す（現在は仮の戻り値）
        // const geminiResponse = await callGeminiAPI(formattedFreeSlots);
        // return geminiResponse;

        return {
            success: true,
            message: "Formatted text generated.",
            data: formattedFreeSlots,
        };
    } catch (error) {
        console.error("Error in getCommonAvailability:", error);
        throw new Error(
            "An error occurred while processing calendar availability.",
        );
    }
}
