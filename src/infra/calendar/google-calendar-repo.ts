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
import { decryptToken, Token } from "@/domain/token";

const initCalendar = (userId: string, token: Token) => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return err(
            CalendarUnauthenticatedError(
                "Server configuration error: Google OAuth credentials are missing",
                {
                    extra: {
                        userId,
                        impl: "google-calendar",
                    },
                },
            ),
        );
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: token.token });
    return ok(google.calendar({ version: "v3", auth: oauth2Client }));
};

export const googleCalendarRepository: CalendarRepository = {
    /**
     * Calendar API を利用してユーザーの空き時間を取得する
     */
    fetchBusySlots: (userId, calendarIds, timeMin, timeMax, tokenRepository) =>
        tokenRepository
            .get(userId, "google")
            .andThen(decryptToken)
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
