import {
    buildSuggestionSearchRange,
    calculateMaxSearchEndDate,
    getDefaultSuggestionSearchDateValues,
    getInclusiveDateInputDayCount,
    MAX_DATE_INPUT_VALUE,
    MAX_SUGGESTION_SEARCH_DAYS,
} from "../suggestion-search-range";

describe("getDefaultSuggestionSearchDateValues", () => {
    it("should default to tomorrow through 14 days from tomorrow in JST date strings", () => {
        const result = getDefaultSuggestionSearchDateValues(
            new Date("2026-06-18T10:00:00.000Z"),
        );

        expect(result).toEqual({
            searchStartDate: "2026-06-19",
            searchEndDate: "2026-07-02",
        });
    });
});

describe("getInclusiveDateInputDayCount", () => {
    it("should count the start and end date inclusively", () => {
        expect(getInclusiveDateInputDayCount("2026-07-10", "2026-07-12")).toBe(
            3,
        );
    });

    it("should return 1 when start and end are the same date", () => {
        expect(getInclusiveDateInputDayCount("2026-07-10", "2026-07-10")).toBe(
            1,
        );
    });
});

describe("calculateMaxSearchEndDate", () => {
    it("should return the inclusive maximum end date from the start date", () => {
        expect(calculateMaxSearchEndDate("2026-07-10")).toBe("2026-09-07");
    });

    it("should not return a date after the supported input maximum", () => {
        expect(calculateMaxSearchEndDate("9999-12-31")).toBe(
            MAX_DATE_INPUT_VALUE,
        );
    });
});

describe("buildSuggestionSearchRange", () => {
    const now = new Date("2026-06-18T10:00:00.000Z");

    it("should build the default JST range when input dates are empty", () => {
        const result = buildSuggestionSearchRange({}, now);

        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.range.start.toISOString()).toBe(
            "2026-06-18T15:00:00.000Z",
        );
        expect(result.range.end.toISOString()).toBe("2026-07-02T15:00:00.000Z");
    });

    it("should build a custom JST date range", () => {
        const result = buildSuggestionSearchRange(
            {
                searchStartDate: "2026-07-10",
                searchEndDate: "2026-07-12",
            },
            now,
        );

        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.range.start.toISOString()).toBe(
            "2026-07-09T15:00:00.000Z",
        );
        expect(result.range.end.toISOString()).toBe("2026-07-12T15:00:00.000Z");
    });

    it("should reject malformed date strings", () => {
        const result = buildSuggestionSearchRange(
            {
                searchStartDate: "2026/07/10",
                searchEndDate: "2026-07-12",
            },
            now,
        );

        expect(result.success).toBe(false);
    });

    it("should reject start dates before tomorrow", () => {
        const result = buildSuggestionSearchRange(
            {
                searchStartDate: "2026-06-18",
                searchEndDate: "2026-06-20",
            },
            now,
        );

        expect(result.success).toBe(false);
    });

    it("should reject end dates before start dates", () => {
        const result = buildSuggestionSearchRange(
            {
                searchStartDate: "2026-07-12",
                searchEndDate: "2026-07-10",
            },
            now,
        );

        expect(result.success).toBe(false);
    });

    it("should reject when end date is exactly one day before start date", () => {
        const result = buildSuggestionSearchRange(
            {
                searchStartDate: "2026-07-12",
                searchEndDate: "2026-07-11",
            },
            now,
        );

        expect(result.success).toBe(false);
    });

    it("should reject ranges longer than the maximum search days", () => {
        const result = buildSuggestionSearchRange(
            {
                searchStartDate: "2026-07-01",
                searchEndDate: "2026-09-01",
            },
            now,
        );

        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.error).toContain(String(MAX_SUGGESTION_SEARCH_DAYS));
    });
});
