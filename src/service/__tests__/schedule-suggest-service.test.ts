vi.mock("server-only", () => ({}));
import {
    createSlots,
    calculateTimeRangeScores,
    generatePrompt,
    EventMember,
} from "../schedule-suggest-service";
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
                id: "user1",
                isRequired: true,
            } as unknown as EventMember,
            {
                id: "user2",
                isRequired: false,
            } as unknown as EventMember,
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
        expect(result[0].availableMembers.required).toHaveLength(1);
        expect(result[0].availableMembers.required[0].id).toBe("user1");
        expect(result[0].availableMembers.optional).toHaveLength(0);

        // Slot 1 (9:30 - 10:30)
        expect(result[1].score).toBe(1);
        expect(result[1].availableMembers.required).toHaveLength(0);
        expect(result[1].availableMembers.optional).toHaveLength(1);
        expect(result[1].availableMembers.optional[0].id).toBe("user2");

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
                id: "user1",
                isRequired: true,
            } as unknown as EventMember,
            {
                id: "user2",
                isRequired: false,
            } as unknown as EventMember,
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

describe("generatePrompt", () => {
    it("should format candidates and properly insert standard text", () => {
        const candidates = [
            {
                timeRange: {
                    start: new Date("2026-02-27T09:00:00.000Z"), // UTC -> 18:00 JST
                    end: new Date("2026-02-27T10:00:00.000Z"), // UTC -> 19:00 JST
                },
                availableMembers: {
                    required: [
                        {
                            id: "user1",
                            isRequired: true,
                        } as unknown as EventMember,
                    ],
                    optional: [],
                },
                score: 10,
            },
        ];
        const description = "Test Event";
        const requiredMemberCount = 2;

        const prompt = generatePrompt(
            candidates,
            description,
            requiredMemberCount,
        );

        expect(prompt).toContain(description);
        expect(prompt).toContain(
            "候補1: 2026/02/27 18:00(金) 〜 2026/02/27 19:00 [平日]",
        );
        expect(prompt).toContain("(必須1/2人, スコア10)");
        expect(prompt).toContain(
            "[start:2026-02-27T09:00:00.000Z, end:2026-02-27T10:00:00.000Z]",
        );
    });
});
