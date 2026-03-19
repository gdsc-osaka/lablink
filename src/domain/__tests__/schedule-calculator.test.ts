vi.mock("server-only", () => ({}));
import {
    createSlots,
    calculateTimeRangeScores,
    EventMember,
} from "../schedule-calculator";
import { UserTimeRanges } from "@/domain/calendar";

describe("createSlots", () => {
    it("should generate overlapping slots correctly", () => {
        const timeRange = {
            start: new Date("2026-02-27T09:00:00.000Z"),
            end: new Date("2026-02-27T12:00:00.000Z"),
        };
        const durationMinutes = 60;
        const intervalMinutes = 30;

        const result = createSlots(timeRange, durationMinutes, intervalMinutes);

        expect(result).toHaveLength(5);
        expect(result[0].start.toISOString()).toBe("2026-02-27T09:00:00.000Z");
        expect(result[0].end.toISOString()).toBe("2026-02-27T10:00:00.000Z");

        expect(result[1].start.toISOString()).toBe("2026-02-27T09:30:00.000Z");
        expect(result[1].end.toISOString()).toBe("2026-02-27T10:30:00.000Z");

        expect(result[4].start.toISOString()).toBe("2026-02-27T11:00:00.000Z");
        expect(result[4].end.toISOString()).toBe("2026-02-27T12:00:00.000Z");
    });

    it("should return empty array if duration is larger than timeRange", () => {
        const timeRange = {
            start: new Date("2026-02-27T09:00:00.000Z"),
            end: new Date("2026-02-27T09:30:00.000Z"), // 30 mins
        };
        const result = createSlots(timeRange, 60, 30);
        expect(result).toHaveLength(0);
    });
});

describe("calculateTimeRangeScores", () => {
    it("should calculate available members and scores correctly", () => {
        const timeRange = {
            start: new Date("2026-02-27T09:00:00.000Z"),
            end: new Date("2026-02-27T11:00:00.000Z"), // 2 hours
        };
        const durationMinutes = 60; // 1 hour slots

        const members: EventMember[] = [
            {
                uid: "user1",
                isRequired: true,
            } as EventMember,
            {
                uid: "user2",
                isRequired: false,
            } as EventMember,
        ];

        const memberAvailability: UserTimeRanges[] = [
            {
                userId: "user1",
                timeRanges: [
                    {
                        start: new Date("2026-02-27T09:00:00.000Z"),
                        end: new Date("2026-02-27T10:00:00.000Z"),
                    },
                ],
            },
            {
                userId: "user2",
                timeRanges: [
                    {
                        start: new Date("2026-02-27T09:30:00.000Z"),
                        end: new Date("2026-02-27T10:30:00.000Z"),
                    },
                ],
            },
        ];

        const result = calculateTimeRangeScores(
            timeRange,
            durationMinutes,
            memberAvailability,
            members,
        );

        expect(result).toHaveLength(3);

        // Slot 0 (9:00 - 10:00)
        expect(result[0].score).toBe(10);
        expect(result[0].availableMemberIds.required).toHaveLength(1);
        expect(result[0].availableMemberIds.required[0]).toBe("user1");
        expect(result[0].availableMemberIds.optional).toHaveLength(0);

        // Slot 1 (9:30 - 10:30)
        expect(result[1].score).toBe(1);
        expect(result[1].availableMemberIds.required).toHaveLength(0);
        expect(result[1].availableMemberIds.optional).toHaveLength(1);
        expect(result[1].availableMemberIds.optional[0]).toBe("user2");

        // Slot 2 (10:00 - 11:00)
        expect(result[2].score).toBe(0);
    });

    it("should accumulate score correctly when both are available", () => {
        const timeRange = {
            start: new Date("2026-02-27T09:00:00.000Z"),
            end: new Date("2026-02-27T10:00:00.000Z"),
        };
        const durationMinutes = 60;
        const members: EventMember[] = [
            {
                uid: "user1",
                isRequired: true,
            } as EventMember,
            {
                uid: "user2",
                isRequired: false,
            } as EventMember,
        ];
        const memberAvailability: UserTimeRanges[] = [
            {
                userId: "user1",
                timeRanges: [
                    {
                        start: new Date("2026-02-27T09:00:00.000Z"),
                        end: new Date("2026-02-27T10:00:00.000Z"),
                    },
                ],
            },
            {
                userId: "user2",
                timeRanges: [
                    {
                        start: new Date("2026-02-27T09:00:00.000Z"),
                        end: new Date("2026-02-27T10:00:00.000Z"),
                    },
                ],
            },
        ];

        const result = calculateTimeRangeScores(
            timeRange,
            durationMinutes,
            memberAvailability,
            members,
        );
        expect(result).toHaveLength(1);
        expect(result[0].score).toBe(11); // 10 + 1
    });
});
