import type { TimeRange } from "./calendar";

export const DEFAULT_SUGGESTION_SEARCH_DAYS = 14;
export const MAX_SUGGESTION_SEARCH_DAYS = 60;

type SuggestionSearchRangeInput = {
    searchStartDate?: string;
    searchEndDate?: string;
};

type SuggestionSearchRangeResult =
    | { success: true; range: TimeRange }
    | { success: false; error: string };

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const JST_OFFSET_HOURS = 9;

export const getDefaultSuggestionSearchDateValues = (
    now: Date = new Date(),
): Required<SuggestionSearchRangeInput> => {
    const tomorrow = addDays(startOfJSTDate(now), 1);
    const defaultEnd = addDays(tomorrow, DEFAULT_SUGGESTION_SEARCH_DAYS - 1);

    return {
        searchStartDate: formatJSTDateInput(tomorrow),
        searchEndDate: formatJSTDateInput(defaultEnd),
    };
};

export const buildSuggestionSearchRange = (
    input: SuggestionSearchRangeInput,
    now: Date = new Date(),
): SuggestionSearchRangeResult => {
    const defaults = getDefaultSuggestionSearchDateValues(now);
    const searchStartDate =
        input.searchStartDate?.trim() || defaults.searchStartDate;
    const searchEndDate = input.searchEndDate?.trim() || defaults.searchEndDate;

    const start = parseJSTDateOnly(searchStartDate, "start");
    const end = parseJSTDateOnly(searchEndDate, "end");

    if (!start || !end) {
        return {
            success: false,
            error: "検索期間は yyyy-MM-dd 形式の日付で指定してください",
        };
    }

    const tomorrow = addDays(startOfJSTDate(now), 1);
    if (start.getTime() < tomorrow.getTime()) {
        return {
            success: false,
            error: "検索開始日は明日以降の日付を指定してください",
        };
    }

    if (start.getTime() >= end.getTime()) {
        return {
            success: false,
            error: "検索終了日は検索開始日以降の日付を指定してください",
        };
    }

    // end is exclusive, so subtract 1ms to count the selected end date itself.
    const selectedDays = getInclusiveJSTDayCount(
        start,
        new Date(end.getTime() - 1),
    );
    if (selectedDays > MAX_SUGGESTION_SEARCH_DAYS) {
        return {
            success: false,
            error: `検索期間は最大${MAX_SUGGESTION_SEARCH_DAYS}日まで指定できます`,
        };
    }

    return { success: true, range: { start, end } };
};

export const getInclusiveDateInputDayCount = (
    startDate: string,
    endDate: string,
): number => {
    const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
    const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
    const startTime = Date.UTC(startYear, startMonth - 1, startDay);
    const endTime = Date.UTC(endYear, endMonth - 1, endDay);

    return Math.floor((endTime - startTime) / DAY_MS) + 1;
};

const parseJSTDateOnly = (
    value: string,
    boundary: "start" | "end",
): Date | undefined => {
    if (!DATE_ONLY_PATTERN.test(value)) {
        return undefined;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date =
        boundary === "start"
            ? new Date(Date.UTC(year, month - 1, day, -JST_OFFSET_HOURS))
            : new Date(Date.UTC(year, month - 1, day, 24 - JST_OFFSET_HOURS));

    const dateToValidate =
        boundary === "start" ? date : new Date(date.getTime() - 1);

    return formatJSTDateInput(dateToValidate) === value ? date : undefined;
};

const startOfJSTDate = (date: Date): Date => {
    const parts = getJSTDateParts(date);
    return new Date(
        Date.UTC(parts.year, parts.month - 1, parts.day, -JST_OFFSET_HOURS),
    );
};

const addDays = (date: Date, days: number): Date =>
    new Date(date.getTime() + days * DAY_MS);

const getInclusiveJSTDayCount = (start: Date, end: Date): number => {
    const startDay = startOfJSTDate(start);
    const endDay = startOfJSTDate(end);
    return Math.floor((endDay.getTime() - startDay.getTime()) / DAY_MS) + 1;
};

const formatJSTDateInput = (date: Date): string => {
    const parts = getJSTDateParts(date);
    return [
        parts.year,
        String(parts.month).padStart(2, "0"),
        String(parts.day).padStart(2, "0"),
    ].join("-");
};

const getJSTDateParts = (
    date: Date,
): { year: number; month: number; day: number } => {
    const jstDate = new Date(
        date.getTime() + JST_OFFSET_HOURS * 60 * 60 * 1000,
    );
    return {
        year: jstDate.getUTCFullYear(),
        month: jstDate.getUTCMonth() + 1,
        day: jstDate.getUTCDate(),
    };
};
