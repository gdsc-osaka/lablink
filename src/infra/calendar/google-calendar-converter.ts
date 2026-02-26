import { GaxiosError } from "gaxios";
import {
    CalendarError,
    CalendarNotFoundError,
    CalendarPermissionDeniedError,
    CalendarTooManyRequestsError,
    CalendarUnauthenticatedError,
    CalendarUnknownError,
} from "@/domain/calendar";
import { calendar_v3 } from "googleapis";

const CALENDAR_IMPL = "google-calendar";

export type GoogleCalendarErrorResponse = {
    error: {
        errors: (calendar_v3.Schema$Error & {
            message: string;
            locationType: string;
            location: string;
        })[];
        code: number;
        message: string;
    };
};

/** @see https://developers.google.com/workspace/calendar/api/guides/errors */
export const toCalendarError = (
    error: GaxiosError<GoogleCalendarErrorResponse>,
    userId: string,
    calendarIds: string[],
): CalendarError => {
    const _error = error as GaxiosError<GoogleCalendarErrorResponse>;

    if (!_error.response) {
        return CalendarUnknownError(_error.message, {
            extra: {
                impl: CALENDAR_IMPL,
                userId,
                calendarIds,
            },
        });
    }

    const data = _error.response.data;

    switch (data.error.code) {
        case 401:
            return CalendarUnauthenticatedError(data.error.message, {
                extra: {
                    impl: CALENDAR_IMPL,
                    userId,
                },
            });
        case 403:
            switch (data.error.errors[0].domain) {
                case "usageLimits":
                    return CalendarTooManyRequestsError(data.error.message, {
                        extra: {
                            impl: CALENDAR_IMPL,
                            userId,
                        },
                    });
                case "calendar":
                    return CalendarPermissionDeniedError(data.error.message, {
                        extra: { impl: CALENDAR_IMPL, userId, calendarIds },
                    });
                default:
                    return CalendarUnknownError(data.error.message, {
                        extra: { impl: CALENDAR_IMPL, userId, calendarIds },
                    });
            }
        case 404:
            return CalendarNotFoundError(data.error.message, {
                extra: { impl: CALENDAR_IMPL, userId, calendarIds },
            });
        case 429:
            return CalendarTooManyRequestsError(data.error.message, {
                extra: { impl: CALENDAR_IMPL, userId },
            });
        default:
            return CalendarUnknownError(data.error.message, {
                extra: { impl: CALENDAR_IMPL, userId, calendarIds },
            });
    }
};
