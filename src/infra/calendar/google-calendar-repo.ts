import "server-only";

import { google } from "googleapis";
import {
    CalendarRepository,
    TimeRange,
    CalendarUnauthenticatedError,
} from "@/domain/calendar";
import { ResultAsync, err, ok } from "neverthrow";
import { GaxiosError } from "gaxios";
import {
    GoogleCalendarErrorResponse,
    toCalendarError,
} from "./google-calendar-converter";
import { getFirestoreAdmin } from "@/firebase/admin";

const initCalendar = (userId: string, refreshToken: string) => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return err(
            CalendarUnauthenticatedError(
                "Server configuration error: Google OAuth credentials are missing",
                {
                    extra: {
                        userId,
                        impl: "Server configuration error",
                    },
                },
            ),
        );
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return ok(google.calendar({ version: "v3", auth: oauth2Client }));
};

const getRefreshToken = async (userId: string): Promise<string | null> => {
    const db = getFirestoreAdmin();
    const snapshot = await db
        .collection("accounts")
        .where("userId", "==", userId)
        .where("provider", "==", "google")
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    return (snapshot.docs[0].data().refresh_token as string) || null;
};

export const googleCalendarRepository: CalendarRepository = {
    /**
     * Calendar API を利用してユーザーの空き時間を取得する
     */
    fetchBusySlots: (userId, calendarIds, timeMin, timeMax) =>
        ResultAsync.fromPromise(getRefreshToken(userId), (error) =>
            CalendarUnauthenticatedError("Failed to fetch refresh token from DB", {
                extra: { userId, impl: String(error) },
            }),
        )
            .andThen((token) =>
                token
                    ? ok(token)
                    : err(
                          CalendarUnauthenticatedError(
                              "No refresh token found for user",
                              { extra: { userId, impl: "getRefreshToken" } },
                          ),
                      ),
            )
            .andThen((token) => initCalendar(userId, token))
            .andThen((calendar) =>
                ResultAsync.fromPromise(
                    calendar.freebusy.query({
                        requestBody: {
                            timeMin: timeMin.toISOString(),
                            timeMax: timeMax.toISOString(),
                            timeZone: "Asia/Tokyo",
                            items: calendarIds.map((id) => ({ id })),
                        },
                    }),
                    (error) => {
                        const _error =
                            error as GaxiosError<GoogleCalendarErrorResponse>;
                        return toCalendarError(_error, userId, calendarIds);
                    },
                ),
            )
            .map((response) => ({
                userId,
                timeRanges: calendarIds.flatMap(
                    (calendarId) =>
                        response.data.calendars?.[calendarId]?.busy
                            ?.filter(
                                (
                                    slot,
                                ): slot is { start: string; end: string } =>
                                    typeof slot.start === "string" &&
                                    typeof slot.end === "string",
                            )
                            .map(
                                (slot): TimeRange => ({
                                    start: new Date(slot.start),
                                    end: new Date(slot.end),
                                }),
                            ) || [],
                ),
            })),
};
