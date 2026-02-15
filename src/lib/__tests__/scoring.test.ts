import { describe, it, expect } from "vitest";
import {
    splitInto30MinSlots,
    calculateSlotAvailability,
    generateCandidates,
    filterByTimeOfDay,
} from "../scoring";
import { MemberInfo } from "@/domain/ai-suggest";

describe("splitInto30MinSlots", () => {
    it("should generate slots starting at 00 minutes only", () => {
        const freeSlots = [
            {
                start: "2025-01-01T00:00:00.000Z",
                end: "2025-01-01T02:00:00.000Z",
            },
        ];
        const result = splitInto30MinSlots(freeSlots);

        expect(result).toHaveLength(4); // 0:00, 0:30, 1:00, 1:30
        expect(result[0]).toBe("2025-01-01T00:00:00.000Z");
        expect(result[1]).toBe("2025-01-01T00:30:00.000Z");
        expect(result[2]).toBe("2025-01-01T01:00:00.000Z");
        expect(result[3]).toBe("2025-01-01T01:30:00.000Z");
    });

    it("should round up non-00 minute starts to next hour", () => {
        const freeSlots = [
            {
                start: "2025-01-01T00:15:00.000Z",
                end: "2025-01-01T02:00:00.000Z",
            },
        ];
        const result = splitInto30MinSlots(freeSlots);

        expect(result[0]).toBe("2025-01-01T01:00:00.000Z"); // Starts at 1:00, not 0:15
        expect(result).toHaveLength(2); // 1:00, 1:30 only
    });

    it("should handle already aligned 00 minute starts", () => {
        const freeSlots = [
            {
                start: "2025-01-01T03:00:00.123Z",
                end: "2025-01-01T04:00:00.000Z",
            },
        ];
        const result = splitInto30MinSlots(freeSlots);

        expect(result[0]).toBe("2025-01-01T03:00:00.000Z"); // Milliseconds stripped
        expect(result).toHaveLength(2); // 3:00, 3:30
    });

    it("should return empty array for slots too short to fit 30 minutes", () => {
        const freeSlots = [
            {
                start: "2025-01-01T00:15:00.000Z",
                end: "2025-01-01T00:45:00.000Z",
            },
        ];
        const result = splitInto30MinSlots(freeSlots);

        expect(result).toHaveLength(0); // Rounded up to 1:00, but ends at 0:45
    });

    it("should handle multiple free slots", () => {
        const freeSlots = [
            {
                start: "2025-01-01T00:00:00.000Z",
                end: "2025-01-01T01:00:00.000Z",
            },
            {
                start: "2025-01-01T02:00:00.000Z",
                end: "2025-01-01T03:00:00.000Z",
            },
        ];
        const result = splitInto30MinSlots(freeSlots);

        expect(result).toHaveLength(4); // 0:00, 0:30, 2:00, 2:30
    });
});

describe("filterByTimeOfDay", () => {
    it("should filter morning slots (6-12 JST)", () => {
        const candidates = [
            {
                start: "2025-01-01T21:00:00.000Z",
                end: "2025-01-01T23:00:00.000Z",
                totalScore: 10,
                requiredMemberCount: 1,
                optionalMemberCount: 0,
            }, // JST 6:00 (morning)
            {
                start: "2025-01-01T07:00:00.000Z",
                end: "2025-01-01T09:00:00.000Z",
                totalScore: 10,
                requiredMemberCount: 1,
                optionalMemberCount: 0,
            }, // JST 16:00 (evening)
        ];

        const result = filterByTimeOfDay(candidates, "morning");

        expect(result).toHaveLength(1);
        expect(result[0].start).toBe("2025-01-01T21:00:00.000Z");
    });

    it("should filter noon slots (12-16 JST)", () => {
        const candidates = [
            {
                start: "2025-01-01T03:00:00.000Z",
                end: "2025-01-01T05:00:00.000Z",
                totalScore: 10,
                requiredMemberCount: 1,
                optionalMemberCount: 0,
            }, // JST 12:00 (noon)
            {
                start: "2025-01-01T21:00:00.000Z",
                end: "2025-01-01T23:00:00.000Z",
                totalScore: 10,
                requiredMemberCount: 1,
                optionalMemberCount: 0,
            }, // JST 6:00 (morning)
        ];

        const result = filterByTimeOfDay(candidates, "noon");

        expect(result).toHaveLength(1);
        expect(result[0].start).toBe("2025-01-01T03:00:00.000Z");
    });

    it("should filter evening slots (16-19 JST)", () => {
        const candidates = [
            {
                start: "2025-01-01T07:00:00.000Z",
                end: "2025-01-01T09:00:00.000Z",
                totalScore: 10,
                requiredMemberCount: 1,
                optionalMemberCount: 0,
            }, // JST 16:00 (evening)
            {
                start: "2025-01-01T03:00:00.000Z",
                end: "2025-01-01T05:00:00.000Z",
                totalScore: 10,
                requiredMemberCount: 1,
                optionalMemberCount: 0,
            }, // JST 12:00 (noon)
        ];

        const result = filterByTimeOfDay(candidates, "evening");

        expect(result).toHaveLength(1);
        expect(result[0].start).toBe("2025-01-01T07:00:00.000Z");
    });

    it("should filter night slots (19+ or <6 JST)", () => {
        const candidates = [
            {
                start: "2025-01-01T10:00:00.000Z",
                end: "2025-01-01T12:00:00.000Z",
                totalScore: 10,
                requiredMemberCount: 1,
                optionalMemberCount: 0,
            }, // JST 19:00 (night)
            {
                start: "2025-01-01T19:00:00.000Z",
                end: "2025-01-01T21:00:00.000Z",
                totalScore: 10,
                requiredMemberCount: 1,
                optionalMemberCount: 0,
            }, // JST 4:00 (night)
            {
                start: "2025-01-01T21:00:00.000Z",
                end: "2025-01-01T23:00:00.000Z",
                totalScore: 10,
                requiredMemberCount: 1,
                optionalMemberCount: 0,
            }, // JST 6:00 (morning)
        ];

        const result = filterByTimeOfDay(candidates, "night");

        expect(result).toHaveLength(2);
    });

    it("should handle timezone boundary correctly (23:00 UTC + 9 = 8:00 JST next day)", () => {
        const candidates = [
            {
                start: "2025-01-01T23:00:00.000Z",
                end: "2025-01-02T01:00:00.000Z",
                totalScore: 10,
                requiredMemberCount: 1,
                optionalMemberCount: 0,
            }, // JST 8:00 (morning)
        ];

        const result = filterByTimeOfDay(candidates, "morning");

        expect(result).toHaveLength(1);
    });
});

describe("generateCandidates", () => {
    it("should generate candidates with 1-hour stepping", () => {
        const slots = [
            {
                start: "2025-01-01T00:00:00.000Z",
                end: "2025-01-01T00:30:00.000Z",
                availableMembers: ["user1"],
                score: 10,
            },
            {
                start: "2025-01-01T00:30:00.000Z",
                end: "2025-01-01T01:00:00.000Z",
                availableMembers: ["user1"],
                score: 10,
            },
            {
                start: "2025-01-01T01:00:00.000Z",
                end: "2025-01-01T01:30:00.000Z",
                availableMembers: ["user1"],
                score: 10,
            },
            {
                start: "2025-01-01T01:30:00.000Z",
                end: "2025-01-01T02:00:00.000Z",
                availableMembers: ["user1"],
                score: 10,
            },
        ];
        const members: MemberInfo[] = [
            { userId: "user1", email: "test@example.com", isRequired: true },
        ];

        const result = generateCandidates(slots, 60, members); // 60 minutes = 2 slots

        expect(result.length).toBeGreaterThan(0);
        // Should have candidates starting at slot 0 and slot 2 (1-hour stepping)
        expect(result.some((c) => c.start === "2025-01-01T00:00:00.000Z")).toBe(
            true,
        );
        expect(result.some((c) => c.start === "2025-01-01T01:00:00.000Z")).toBe(
            true,
        );
    });

    it("should prioritize required members in scoring", () => {
        const slots = [
            {
                start: "2025-01-01T00:00:00.000Z",
                end: "2025-01-01T00:30:00.000Z",
                availableMembers: ["user1", "user2"],
                score: 11,
            },
            {
                start: "2025-01-01T00:30:00.000Z",
                end: "2025-01-01T01:00:00.000Z",
                availableMembers: ["user1", "user2"],
                score: 11,
            },
        ];
        const members: MemberInfo[] = [
            {
                userId: "user1",
                email: "required@example.com",
                isRequired: true,
            },
            {
                userId: "user2",
                email: "optional@example.com",
                isRequired: false,
            },
        ];

        const result = generateCandidates(slots, 60, members);

        expect(result.length).toBeGreaterThan(0);
        expect(result[0].requiredMemberCount).toBe(1);
        expect(result[0].optionalMemberCount).toBe(1);
        expect(result[0].totalScore).toBe(22); // 10*2 (required) + 1*2 (optional)
    });

    it("should only include consecutive slots", () => {
        const slots = [
            {
                start: "2025-01-01T00:00:00.000Z",
                end: "2025-01-01T00:30:00.000Z",
                availableMembers: ["user1"],
                score: 10,
            },
            // Gap here (0:30-1:00 missing)
            {
                start: "2025-01-01T01:00:00.000Z",
                end: "2025-01-01T01:30:00.000Z",
                availableMembers: ["user1"],
                score: 10,
            },
        ];
        const members: MemberInfo[] = [
            { userId: "user1", email: "test@example.com", isRequired: true },
        ];

        const result = generateCandidates(slots, 60, members);

        expect(result).toHaveLength(0); // No consecutive 60-minute window
    });

    it("should sort by required member count then score", () => {
        const slots = [
            {
                start: "2025-01-01T00:00:00.000Z",
                end: "2025-01-01T00:30:00.000Z",
                availableMembers: ["user1", "user2"],
                score: 11,
            },
            {
                start: "2025-01-01T00:30:00.000Z",
                end: "2025-01-01T01:00:00.000Z",
                availableMembers: ["user1", "user2"],
                score: 11,
            },
            {
                start: "2025-01-01T02:00:00.000Z",
                end: "2025-01-01T02:30:00.000Z",
                availableMembers: ["user1"],
                score: 10,
            },
            {
                start: "2025-01-01T02:30:00.000Z",
                end: "2025-01-01T03:00:00.000Z",
                availableMembers: ["user1"],
                score: 10,
            },
        ];
        const members: MemberInfo[] = [
            {
                userId: "user1",
                email: "required@example.com",
                isRequired: true,
            },
            {
                userId: "user2",
                email: "optional@example.com",
                isRequired: false,
            },
        ];

        const result = generateCandidates(slots, 60, members);

        // Both have 1 required member, so higher score should be first
        expect(result[0].totalScore).toBeGreaterThanOrEqual(
            result[1]?.totalScore || 0,
        );
    });
});

describe("calculateSlotAvailability", () => {
    it("should calculate available members and scores for each slot", () => {
        const slots = ["2025-01-01T00:00:00.000Z", "2025-01-01T00:30:00.000Z"];
        const memberAvailability = new Map([
            [
                "user1",
                [
                    {
                        start: "2025-01-01T00:00:00.000Z",
                        end: "2025-01-01T01:00:00.000Z",
                    },
                ],
            ],
            [
                "user2",
                [
                    {
                        start: "2025-01-01T00:30:00.000Z",
                        end: "2025-01-01T01:00:00.000Z",
                    },
                ],
            ],
        ]);
        const members: MemberInfo[] = [
            {
                userId: "user1",
                email: "required@example.com",
                isRequired: true,
            },
            {
                userId: "user2",
                email: "optional@example.com",
                isRequired: false,
            },
        ];

        const result = calculateSlotAvailability(
            slots,
            memberAvailability,
            members,
        );

        expect(result).toHaveLength(2);
        expect(result[0].availableMembers).toEqual(["user1"]);
        expect(result[0].score).toBe(10); // 1 required member
        expect(result[1].availableMembers).toEqual(["user1", "user2"]);
        expect(result[1].score).toBe(11); // 1 required + 1 optional
    });
});
