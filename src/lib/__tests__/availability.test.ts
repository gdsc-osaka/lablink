import { describe, it, expect } from "vitest";
import { findCommonFreeSlots } from "../availability";

describe("findCommonFreeSlots", () => {
    it("should return full period when no busy intervals exist", () => {
        const result = findCommonFreeSlots(
            [],
            "2025-01-01T00:00:00.000Z",
            "2025-01-01T10:00:00.000Z",
        );

        expect(result).toHaveLength(1);
        expect(result[0].start).toBe("2025-01-01T00:00:00.000Z");
        expect(result[0].end).toBe("2025-01-01T10:00:00.000Z");
    });

    it("should find free slots around single busy interval", () => {
        const busyIntervals = [
            {
                start: "2025-01-01T03:00:00.000Z",
                end: "2025-01-01T05:00:00.000Z",
            },
        ];

        const result = findCommonFreeSlots(
            busyIntervals,
            "2025-01-01T00:00:00.000Z",
            "2025-01-01T10:00:00.000Z",
        );

        expect(result).toHaveLength(2);
        expect(result[0].start).toBe("2025-01-01T00:00:00.000Z");
        expect(result[0].end).toBe("2025-01-01T03:00:00.000Z");
        expect(result[1].start).toBe("2025-01-01T05:00:00.000Z");
        expect(result[1].end).toBe("2025-01-01T10:00:00.000Z");
    });

    it("should merge overlapping busy intervals", () => {
        const busyIntervals = [
            {
                start: "2025-01-01T02:00:00.000Z",
                end: "2025-01-01T04:00:00.000Z",
            },
            {
                start: "2025-01-01T03:00:00.000Z",
                end: "2025-01-01T05:00:00.000Z",
            },
            {
                start: "2025-01-01T04:30:00.000Z",
                end: "2025-01-01T06:00:00.000Z",
            },
        ];

        const result = findCommonFreeSlots(
            busyIntervals,
            "2025-01-01T00:00:00.000Z",
            "2025-01-01T10:00:00.000Z",
        );

        // Should merge all overlapping intervals into one busy period (2:00-6:00)
        expect(result).toHaveLength(2);
        expect(result[0].start).toBe("2025-01-01T00:00:00.000Z");
        expect(result[0].end).toBe("2025-01-01T02:00:00.000Z");
        expect(result[1].start).toBe("2025-01-01T06:00:00.000Z");
        expect(result[1].end).toBe("2025-01-01T10:00:00.000Z");
    });

    it("should handle busy intervals at boundaries", () => {
        const busyIntervals = [
            {
                start: "2025-01-01T00:00:00.000Z",
                end: "2025-01-01T02:00:00.000Z",
            },
            {
                start: "2025-01-01T08:00:00.000Z",
                end: "2025-01-01T10:00:00.000Z",
            },
        ];

        const result = findCommonFreeSlots(
            busyIntervals,
            "2025-01-01T00:00:00.000Z",
            "2025-01-01T10:00:00.000Z",
        );

        expect(result).toHaveLength(1);
        expect(result[0].start).toBe("2025-01-01T02:00:00.000Z");
        expect(result[0].end).toBe("2025-01-01T08:00:00.000Z");
    });

    it("should filter out busy intervals outside search range", () => {
        const busyIntervals = [
            {
                start: "2024-12-31T20:00:00.000Z",
                end: "2024-12-31T23:00:00.000Z",
            }, // Before range
            {
                start: "2025-01-01T03:00:00.000Z",
                end: "2025-01-01T05:00:00.000Z",
            }, // Within range
            {
                start: "2025-01-01T12:00:00.000Z",
                end: "2025-01-01T15:00:00.000Z",
            }, // After range
        ];

        const result = findCommonFreeSlots(
            busyIntervals,
            "2025-01-01T00:00:00.000Z",
            "2025-01-01T10:00:00.000Z",
        );

        expect(result).toHaveLength(2);
        expect(result[0].start).toBe("2025-01-01T00:00:00.000Z");
        expect(result[0].end).toBe("2025-01-01T03:00:00.000Z");
        expect(result[1].start).toBe("2025-01-01T05:00:00.000Z");
        expect(result[1].end).toBe("2025-01-01T10:00:00.000Z");
    });

    it("should handle adjacent busy intervals", () => {
        const busyIntervals = [
            {
                start: "2025-01-01T02:00:00.000Z",
                end: "2025-01-01T04:00:00.000Z",
            },
            {
                start: "2025-01-01T04:00:00.000Z",
                end: "2025-01-01T06:00:00.000Z",
            },
        ];

        const result = findCommonFreeSlots(
            busyIntervals,
            "2025-01-01T00:00:00.000Z",
            "2025-01-01T10:00:00.000Z",
        );

        // Adjacent intervals should be merged
        expect(result).toHaveLength(2);
        expect(result[0].start).toBe("2025-01-01T00:00:00.000Z");
        expect(result[0].end).toBe("2025-01-01T02:00:00.000Z");
        expect(result[1].start).toBe("2025-01-01T06:00:00.000Z");
        expect(result[1].end).toBe("2025-01-01T10:00:00.000Z");
    });

    it("should return empty array when entire period is busy", () => {
        const busyIntervals = [
            {
                start: "2025-01-01T00:00:00.000Z",
                end: "2025-01-01T10:00:00.000Z",
            },
        ];

        const result = findCommonFreeSlots(
            busyIntervals,
            "2025-01-01T00:00:00.000Z",
            "2025-01-01T10:00:00.000Z",
        );

        expect(result).toHaveLength(0);
    });

    it("should handle unsorted busy intervals", () => {
        const busyIntervals = [
            {
                start: "2025-01-01T06:00:00.000Z",
                end: "2025-01-01T08:00:00.000Z",
            },
            {
                start: "2025-01-01T02:00:00.000Z",
                end: "2025-01-01T04:00:00.000Z",
            },
        ];

        const result = findCommonFreeSlots(
            busyIntervals,
            "2025-01-01T00:00:00.000Z",
            "2025-01-01T10:00:00.000Z",
        );

        expect(result).toHaveLength(3);
        expect(result[0].start).toBe("2025-01-01T00:00:00.000Z");
        expect(result[0].end).toBe("2025-01-01T02:00:00.000Z");
        expect(result[1].start).toBe("2025-01-01T04:00:00.000Z");
        expect(result[1].end).toBe("2025-01-01T06:00:00.000Z");
        expect(result[2].start).toBe("2025-01-01T08:00:00.000Z");
        expect(result[2].end).toBe("2025-01-01T10:00:00.000Z");
    });

    it("should handle busy intervals partially overlapping search range", () => {
        const busyIntervals = [
            {
                start: "2024-12-31T23:00:00.000Z",
                end: "2025-01-01T02:00:00.000Z",
            }, // Starts before, ends within
            {
                start: "2025-01-01T08:00:00.000Z",
                end: "2025-01-01T12:00:00.000Z",
            }, // Starts within, ends after
        ];

        const result = findCommonFreeSlots(
            busyIntervals,
            "2025-01-01T00:00:00.000Z",
            "2025-01-01T10:00:00.000Z",
        );

        expect(result).toHaveLength(1);
        expect(result[0].start).toBe("2025-01-01T02:00:00.000Z");
        expect(result[0].end).toBe("2025-01-01T08:00:00.000Z");
    });
});
