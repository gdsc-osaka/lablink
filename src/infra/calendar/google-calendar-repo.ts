import "server-only";

import { google } from "googleapis";
import { CalendarRepository, TimeRange } from "@/domain/calendar";
import { ResultAsync } from "neverthrow";
import { GaxiosError } from "gaxios";
import {
    GoogleCalendarErrorResponse,
    toCalendarError,
} from "./google-calendar-converter";
import { decryptToken, Token } from "@/domain/token";

const initCalendar = (token: Token) => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
    );
    oauth2Client.setCredentials({ refresh_token: token.token });
    return google.calendar({ version: "v3", auth: oauth2Client });
};

export const googleCalendarRepository: CalendarRepository = {
    /**
     * Calendar API を利用してユーザーの空き時間を取得する
     */
    fetchBusySlots: (userId, calendarIds, timeMin, timeMax, tokenRepository) =>
        tokenRepository
            .get(userId, "google")
            .andThen(decryptToken)
            .map(initCalendar)
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
