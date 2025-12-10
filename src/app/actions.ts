"use server";

import { cookies } from "next/headers";
import { google } from "googleapis";
import { findCommonFreeSlots } from "@/lib/availability";
import { formatFreeSlotsForAI } from "@/lib/ai-formatter";
import { encryptToken, decryptToken } from "@/lib/encryption";
import { adminDb, adminAuth } from "@/firebase/server";
import {
    SuggestScheduleRequest,
    SuggestScheduleResponse,
    MemberInfo,
} from "@/domain/ai-suggest";
import {
    splitInto30MinSlots,
    calculateSlotAvailability,
    generateCandidates,
    filterByTimeOfDay,
} from "@/lib/scoring";
import { suggestScheduleWithGemini } from "@/lib/gemini";

// Note: Server ActionsではFirestore Client SDKではなく、
// クライアント側でFirestoreにアクセスする必要があります

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

        // 5. 整形した文字列をGemini APIに渡す（現在は仮の戻り値）
        // const geminiResponse = await callGeminiAPI(formattedFreeSlots);
        // return geminiResponse;

        return {
            success: true,
            message: "Formatted text generated.",
            data: formattedFreeSlots,
        };
    } catch (error) {
        throw new Error(
            "An error occurred while processing calendar availability.",
        );
    }
}

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
    try {
        // Cookie から Firebase ID Token を取得
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return { success: false, message: "Unauthorized: No token found" };
        }

        // Firebase ID Token を検証してユーザーIDを取得
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        if (!refreshToken) {
            return { success: false, message: "Refresh token is required" };
        }

        // リフレッシュトークンを暗号化
        const encryptedRefreshToken = encryptToken(refreshToken);

        // Admin SDK で /users/{userId}/private/tokens に保存
        await adminDb
            .collection("users")
            .doc(userId)
            .collection("private")
            .doc("tokens")
            .set({
                google_refresh_token_encrypted: encryptedRefreshToken,
                google_token_expires_at: new Date(),
                updated_at: new Date(),
            });

        return { success: true, message: "Refresh token saved successfully" };
    } catch (error) {
        return { success: false, message: "Failed to save refresh token" };
    }
}

/**
 * トークンを暗号化（クライアント側で使用）
 *
 * @param plainToken 平文トークン
 * @returns 暗号化されたトークン
 */
export async function encryptTokenForStorage(
    plainToken: string,
): Promise<string> {
    if (!plainToken) {
        throw new Error("plainToken is required");
    }

    try {
        return encryptToken(plainToken);
    } catch (error) {
        throw new Error("Failed to encrypt token");
    }
}

/**
 * トークンを復号化（クライアント側で使用）
 *
 * @param encryptedToken 暗号化されたトークン
 * @returns 復号化されたトークン
 */
export async function decryptTokenFromStorage(
    encryptedToken: string,
): Promise<string> {
    if (!encryptedToken) {
        throw new Error("encryptedToken is required");
    }

    try {
        return decryptToken(encryptedToken);
    } catch (error) {
        throw new Error("Failed to decrypt token");
    }
}

/**
 * リフレッシュトークンから新しいアクセストークンを生成
 * Server Action内でのみ使用（クライアントには公開しない）
 *
 * @param refreshToken リフレッシュトークン
 * @returns アクセストークン
 */
export async function getAccessTokenFromRefreshToken(
    refreshToken: string,
): Promise<string> {
    if (!refreshToken) {
        throw new Error("Refresh token is required");
    }

    // 環境変数のバリデーション
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error(
            "Server configuration error: Google OAuth credentials are missing",
        );
    }

    try {
        // リフレッシュトークンからアクセストークンを生成
        const tokenResponse = await fetch(
            "https://oauth2.googleapis.com/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    refresh_token: refreshToken,
                    grant_type: "refresh_token",
                }),
            },
        );

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            throw new Error(`Failed to refresh access token: ${errorText}`);
        }

        const tokens = await tokenResponse.json();

        return tokens.access_token;
    } catch (error) {
        throw new Error("Failed to refresh access token");
    }
}

/**
 * AI スケジュール提案のメイン関数
 *
 * @param request SuggestScheduleRequest
 * @returns SuggestScheduleResponse
 */
export async function suggestSchedule(
    request: SuggestScheduleRequest,
): Promise<SuggestScheduleResponse> {
    try {
        // 1. グループメンバーの取得
        const memberIds = await fetchGroupMemberIds(request.groupId);

        if (memberIds.length === 0) {
            return {
                success: false,
                message: "グループにメンバーが存在しません",
                suggestions: [],
            };
        }

        // 2. メンバー情報の構築
        const members: MemberInfo[] = await Promise.all(
            memberIds.map(async (userId) => {
                const userDoc = await adminDb
                    .collection("users")
                    .doc(userId)
                    .get();
                const userData = userDoc.data();

                return {
                    userId,
                    email: userData?.email || "",
                    isRequired: request.requiredMemberIds.includes(userId),
                };
            }),
        );

        // 3. 各メンバーのリフレッシュトークンを取得して復号化（並列処理）
        const availabilityPromises = members.map(async (member) => {
            try {
                // Admin SDK でトークン取得
                const tokenDoc = await adminDb
                    .collection("users")
                    .doc(member.userId)
                    .collection("private")
                    .doc("tokens")
                    .get();

                const encryptedToken =
                    tokenDoc.data()?.google_refresh_token_encrypted;

                if (!encryptedToken) {
                    return {
                        userId: member.userId,
                        slots: [],
                        error: new Error("No refresh token"),
                        isRequired: member.isRequired,
                    };
                }

                // 復号化
                const refreshToken = decryptToken(encryptedToken);

                // アクセストークン生成
                const accessToken =
                    await getAccessTokenFromRefreshToken(refreshToken);

                // Calendar API で空き時間取得
                const freeSlots = await fetchUserFreeSlots(
                    accessToken,
                    member.email,
                    request.dateRange.start,
                    request.dateRange.end,
                );

                return {
                    userId: member.userId,
                    slots: freeSlots,
                    error: null,
                    isRequired: member.isRequired,
                };
            } catch (error) {
                return {
                    userId: member.userId,
                    slots: [],
                    error:
                        error instanceof Error
                            ? error
                            : new Error("Unknown error"),
                    isRequired: member.isRequired,
                };
            }
        });

        const results = await Promise.all(availabilityPromises);

        // 必須メンバーのカレンダー取得に失敗した場合はエラーとする
        const failedRequiredMembers = results.filter(
            (r) => r.error && r.isRequired,
        );
        if (failedRequiredMembers.length > 0) {
            const userIds = failedRequiredMembers
                .map((r) => r.userId)
                .join(", ");
            return {
                success: false,
                message: `必須メンバーのカレンダー情報を取得できませんでした: ${userIds}`,
                suggestions: [],
            };
        }

        // 成功したメンバーの空き時間をMapに格納
        const memberAvailability = new Map<
            string,
            { start: string; end: string }[]
        >();
        for (const result of results) {
            if (!result.error) {
                memberAvailability.set(result.userId, result.slots);
            }
        }

        // 4. 全員の空き時間を結合
        const allFreeSlots: { start: string; end: string }[] = [];
        memberAvailability.forEach((slots) => {
            allFreeSlots.push(...slots);
        });

        // 5. 30分スロットに分割
        const slots = splitInto30MinSlots(allFreeSlots);

        // 6. 各スロットで参加可能なメンバーを集計
        const timeSlots = calculateSlotAvailability(
            slots,
            memberAvailability,
            members,
        );

        // 7. 連続スロットを結合して候補を生成
        let candidates = generateCandidates(
            timeSlots,
            request.durationMinutes,
            members,
        );

        // 8. 時間帯フィルタリング
        candidates = filterByTimeOfDay(candidates, request.timeSlot);

        if (candidates.length === 0) {
            return {
                success: false,
                message: "条件に合う日程が見つかりませんでした",
                suggestions: [],
            };
        }

        // 9. Gemini API で最適な候補を選択
        const requiredMemberCount = members.filter((m) => m.isRequired).length;
        const suggestions = await suggestScheduleWithGemini(
            candidates,
            request.description,
            requiredMemberCount,
        );

        return {
            success: true,
            suggestions,
        };
    } catch (error) {
        return {
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "不明なエラーが発生しました",
            suggestions: [],
        };
    }
}

/**
 * グループのメンバーID一覧を取得
 */
async function fetchGroupMemberIds(groupId: string): Promise<string[]> {
    const snapshot = await adminDb
        .collection("groups")
        .doc(groupId)
        .collection("users")
        .get();

    return snapshot.docs.map((doc) => doc.id);
}

/**
 * 1人のユーザーの空き時間を Calendar API から取得
 */
async function fetchUserFreeSlots(
    accessToken: string,
    email: string,
    timeMin: string,
    timeMax: string,
): Promise<{ start: string; end: string }[]> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const freeBusyResponse = await calendar.freebusy.query({
        requestBody: {
            timeMin,
            timeMax,
            timeZone: "Asia/Tokyo",
            items: [{ id: email }],
        },
    });

    const busySlots = freeBusyResponse.data.calendars?.[email]?.busy || [];

    // busy → free に変換
    return findCommonFreeSlots(
        busySlots.map((slot) => ({
            start: slot.start || "",
            end: slot.end || "",
        })),
        timeMin,
        timeMax,
    );
}