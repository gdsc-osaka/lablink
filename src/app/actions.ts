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
import { cookies } from "next/headers";
import { getAuthAdmin } from "@/firebase/admin";
import { createTokenService } from "@/service/token-service";

export type Result<T, E> =
    | { success: true; data: T }
    | { success: false; error: E };

const authAdmin = getAuthAdmin();

const calendarRepository = googleCalendarRepository;

const tokenRepository = googleTokenRepository;
const tokenService = createTokenService(tokenRepository);

/**
 * リフレッシュトークンを暗号化してFirestoreに保存する
 * Cookie ベースの認証を使用
 *
 * @param refreshToken Google OAuth リフレッシュトークン
 * @returns 成功/失敗の結果
 */
export async function saveRefreshToken(
    refreshToken: string,
): Promise<{ success: boolean; message: string }> {
    // Cookie から Firebase ID Token を取得
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return { success: false, message: "Unauthorized: No token found" };
    }

    // Firebase ID Token を検証してユーザーIDを取得
    const decodedToken = await authAdmin.verifyIdToken(token);
    const userId = decodedToken.uid;

    if (!refreshToken) {
        return { success: false, message: "Refresh token is required" };
    }

    const tokenSaveResult = await tokenService.saveToken({
        userId,
        token: refreshToken,
        serviceType: "google",
        expiresAt: null,
    });

    if (tokenSaveResult.isErr()) {
        console.warn("Failed to save refresh token:", tokenSaveResult.error);
        return {
            success: false,
            message:
                "Failed to save refresh token: " +
                tokenSaveResult.error.message,
        };
    }

    return { success: true, message: "Refresh token saved successfully" };
}

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
