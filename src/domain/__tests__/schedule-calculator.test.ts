vi.mock("server-only", () => ({}));
import {
    createSlots,
    calculateTimeRangeScores,
    calculateSchedulePreferenceScore,
    EventMember,
    findMatchingPreferredHourRange,
    selectPreferredAndFallbackScores,
    SchedulePreferenceSchema,
    selectDiverseTopN,
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

    it("should filter slots by single allowedHourRanges (morning only)", () => {
        // UTC 15:00 = JST 0:00 から UTC 翌日 15:00 = JST 翌日 0:00 まで（24時間）
        const timeRange = {
            start: new Date("2026-02-26T15:00:00.000Z"), // JST 2/27 0:00
            end: new Date("2026-02-27T15:00:00.000Z"), // JST 2/28 0:00
        };
        // 朝（JST 8:00〜12:00）のみ許可 → UTC 23:00〜03:00 のスロットだけ残る
        const result = createSlots(timeRange, 60, 60, [{ start: 8, end: 12 }]);

        // JST 8:00, 9:00, 10:00, 11:00 の4スロット（duration=60分, interval=60分）
        expect(result).toHaveLength(4);
        // 最初のスロット: UTC 23:00 = JST 8:00
        expect(result[0].start.toISOString()).toBe("2026-02-26T23:00:00.000Z");
        // 最後のスロット: UTC 02:00 = JST 11:00
        expect(result[3].start.toISOString()).toBe("2026-02-27T02:00:00.000Z");
    });

    it("should filter slots by multiple allowedHourRanges (morning + night)", () => {
        const timeRange = {
            start: new Date("2026-02-26T15:00:00.000Z"), // JST 2/27 0:00
            end: new Date("2026-02-27T15:00:00.000Z"), // JST 2/28 0:00
        };
        // 朝（8〜12）と夜（18〜22）を許可
        const result = createSlots(timeRange, 60, 60, [
            { start: 8, end: 12 },
            { start: 18, end: 22 },
        ]);

        // 朝4スロット + 夜4スロット = 8スロット
        expect(result).toHaveLength(8);
        // 全スロットが朝 or 夜の時間帯に含まれることを検証
        for (const slot of result) {
            const hourJST = (slot.start.getUTCHours() + 9) % 24;
            const inMorning = hourJST >= 8 && hourJST < 12;
            const inNight = hourJST >= 18 && hourJST < 22;
            expect(inMorning || inNight).toBe(true);
        }
    });

    it("should generate all slots when allowedHourRanges is undefined", () => {
        const timeRange = {
            start: new Date("2026-02-26T15:00:00.000Z"), // JST 2/27 0:00
            end: new Date("2026-02-27T15:00:00.000Z"), // JST 2/28 0:00
        };
        const withFilter = createSlots(timeRange, 60, 60, undefined);
        const withoutFilter = createSlots(timeRange, 60, 60);

        // undefined を渡した場合と省略した場合で同じ結果
        expect(withFilter).toHaveLength(withoutFilter.length);
        expect(withFilter).toHaveLength(24);
    });
});

describe("SchedulePreferenceSchema", () => {
    it("should parse day and hour-range preferences", () => {
        const result = SchedulePreferenceSchema.safeParse({
            dayWeights: [
                {
                    dayOfWeek: "friday",
                    reason: "飲み会なので金曜日が適しています。",
                },
            ],
            hourRangeWeights: [
                {
                    startHour: 19,
                    durationHours: 3,
                    reason: "飲み会なので19時から22時が適しています。",
                },
            ],
            summary: "金曜日の19時から22時を優先します。",
        });

        expect(result.success).toBe(true);
    });

    it("should reject unsupported days of week", () => {
        const result = SchedulePreferenceSchema.safeParse({
            dayWeights: [
                {
                    dayOfWeek: "holiday",
                    reason: "Invalid day.",
                },
            ],
            hourRangeWeights: [],
            summary: "Invalid preference.",
        });

        expect(result.success).toBe(false);
    });

    it("should parse an hour range that crosses midnight", () => {
        const result = SchedulePreferenceSchema.safeParse({
            dayWeights: [],
            hourRangeWeights: [
                {
                    startHour: 22,
                    durationHours: 4,
                    reason: "飲み会なので22時から翌2時が適しています。",
                },
            ],
            summary: "22時から翌2時を優先します。",
        });

        expect(result.success).toBe(true);
    });

    it.each([0, 25])(
        "should reject durationHours outside the supported range: %i",
        (durationHours) => {
            const result = SchedulePreferenceSchema.safeParse({
                dayWeights: [],
                hourRangeWeights: [
                    {
                        startHour: 22,
                        durationHours,
                        reason: "Invalid hour range.",
                    },
                ],
                summary: "Invalid preference.",
            });

            expect(result.success).toBe(false);
        },
    );
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

    it("should add small schedule preference scores without exceeding required member score", () => {
        const timeRange = {
            start: new Date("2026-02-27T09:00:00.000Z"), // JST Friday 18:00
            end: new Date("2026-02-27T10:00:00.000Z"),
        };
        const members: EventMember[] = [
            {
                uid: "user1",
                isRequired: true,
            } as EventMember,
        ];
        const memberAvailability: UserTimeRanges[] = [
            {
                userId: "user1",
                timeRanges: [timeRange],
            },
        ];

        const result = calculateTimeRangeScores(
            timeRange,
            60,
            memberAvailability,
            members,
            30,
            undefined,
            {
                dayWeights: [
                    {
                        dayOfWeek: "friday",
                        reason: "金曜日が適しています。",
                    },
                ],
                hourRangeWeights: [
                    {
                        startHour: 18,
                        durationHours: 3,
                        reason: "夕方が適しています。",
                    },
                ],
                summary: "金曜日の夕方を優先します。",
            },
        );

        expect(result).toHaveLength(1);
        expect(result[0].score).toBe(13);
    });

    it("should keep required member availability above preference-only matches", () => {
        const timeRange = {
            start: new Date("2026-02-27T09:00:00.000Z"), // JST Friday 18:00
            end: new Date("2026-02-27T11:00:00.000Z"),
        };
        const members: EventMember[] = [
            {
                uid: "user1",
                isRequired: true,
            } as EventMember,
        ];
        const memberAvailability: UserTimeRanges[] = [
            {
                userId: "user1",
                timeRanges: [
                    {
                        start: new Date("2026-02-27T10:00:00.000Z"),
                        end: new Date("2026-02-27T11:00:00.000Z"),
                    },
                ],
            },
        ];

        const result = calculateTimeRangeScores(
            timeRange,
            60,
            memberAvailability,
            members,
            60,
            undefined,
            {
                dayWeights: [],
                hourRangeWeights: [
                    {
                        startHour: 18,
                        durationHours: 1,
                        reason: "18時台が適しています。",
                    },
                ],
                summary: "金曜日の18時台を優先します。",
            },
        );

        expect(result).toHaveLength(2);
        expect(result[0].score).toBe(2);
        expect(result[1].score).toBe(10);
    });
});

describe("calculateSchedulePreferenceScore", () => {
    it("should match when the whole slot is inside the preferred hour range", () => {
        const score = calculateSchedulePreferenceScore(
            {
                start: new Date("2026-02-27T10:00:00.000Z"), // JST Friday 19:00
                end: new Date("2026-02-27T12:00:00.000Z"), // JST Friday 21:00
            },
            {
                dayWeights: [],
                hourRangeWeights: [
                    {
                        startHour: 19,
                        durationHours: 3,
                        reason: "19時から22時が適しています。",
                    },
                ],
                summary: "19時から22時を優先します。",
            },
        );

        expect(score).toBe(2);
    });

    it("should not match when the slot starts inside but ends outside the preferred hour range", () => {
        const score = calculateSchedulePreferenceScore(
            {
                start: new Date("2026-02-27T12:00:00.000Z"), // JST Friday 21:00
                end: new Date("2026-02-27T14:00:00.000Z"), // JST Friday 23:00
            },
            {
                dayWeights: [],
                hourRangeWeights: [
                    {
                        startHour: 19,
                        durationHours: 3,
                        reason: "19時から22時が適しています。",
                    },
                ],
                summary: "19時から22時を優先します。",
            },
        );

        expect(score).toBe(0);
    });

    it("should match hour ranges that cross midnight", () => {
        const score = calculateSchedulePreferenceScore(
            {
                start: new Date("2026-02-27T16:00:00.000Z"), // JST Saturday 01:00
                end: new Date("2026-02-27T17:00:00.000Z"),
            },
            {
                dayWeights: [],
                hourRangeWeights: [
                    {
                        startHour: 22,
                        durationHours: 4,
                        reason: "夜から深夜が適しています。",
                    },
                ],
                summary: "夜から深夜を優先します。",
            },
        );

        expect(score).toBe(2);
    });

    it("should not add score when preference arrays are empty", () => {
        const score = calculateSchedulePreferenceScore(
            {
                start: new Date("2026-02-27T09:00:00.000Z"),
                end: new Date("2026-02-27T10:00:00.000Z"),
            },
            {
                dayWeights: [],
                hourRangeWeights: [],
                summary: "希望条件なし。",
            },
        );

        expect(score).toBe(0);
    });
});

describe("findMatchingPreferredHourRange", () => {
    it("should return the matching hour range with its reason", () => {
        const result = findMatchingPreferredHourRange(
            {
                start: new Date("2026-02-27T10:00:00.000Z"), // JST Friday 19:00
                end: new Date("2026-02-27T12:00:00.000Z"), // JST Friday 21:00
            },
            {
                dayWeights: [],
                hourRangeWeights: [
                    {
                        startHour: 19,
                        durationHours: 3,
                        reason: "飲み会なので19時から22時が適しています。",
                    },
                ],
                summary: "19時から22時を優先します。",
            },
        );

        expect(result?.reason).toBe("飲み会なので19時から22時が適しています。");
    });

    it("should return undefined when no hour range contains the whole slot", () => {
        const result = findMatchingPreferredHourRange(
            {
                start: new Date("2026-02-27T12:00:00.000Z"), // JST Friday 21:00
                end: new Date("2026-02-27T14:00:00.000Z"), // JST Friday 23:00
            },
            {
                dayWeights: [],
                hourRangeWeights: [
                    {
                        startHour: 19,
                        durationHours: 3,
                        reason: "19時から22時が適しています。",
                    },
                ],
                summary: "19時から22時を優先します。",
            },
        );

        expect(result).toBeUndefined();
    });
});

describe("selectDiverseTopN", () => {
    it("should select high-score candidates without overlapping selected slots", () => {
        const scores = [
            {
                timeRange: {
                    start: new Date("2026-02-27T09:00:00.000Z"),
                    end: new Date("2026-02-27T11:00:00.000Z"),
                },
                availableMemberIds: { required: ["user1"], optional: [] },
                score: 13,
            },
            {
                timeRange: {
                    start: new Date("2026-02-27T09:30:00.000Z"),
                    end: new Date("2026-02-27T11:30:00.000Z"),
                },
                availableMemberIds: { required: ["user1"], optional: [] },
                score: 12,
            },
            {
                timeRange: {
                    start: new Date("2026-02-27T12:00:00.000Z"),
                    end: new Date("2026-02-27T14:00:00.000Z"),
                },
                availableMemberIds: { required: ["user1"], optional: [] },
                score: 11,
            },
        ];

        const result = selectDiverseTopN(scores, 2);

        expect(result).toHaveLength(2);
        expect(result[0].timeRange.start.toISOString()).toBe(
            "2026-02-27T09:00:00.000Z",
        );
        expect(result[1].timeRange.start.toISOString()).toBe(
            "2026-02-27T12:00:00.000Z",
        );
    });

    it("should return an empty array when n is not positive", () => {
        const result = selectDiverseTopN(
            [
                {
                    timeRange: {
                        start: new Date("2026-02-27T09:00:00.000Z"),
                        end: new Date("2026-02-27T10:00:00.000Z"),
                    },
                    availableMemberIds: { required: [], optional: [] },
                    score: 1,
                },
            ],
            0,
        );

        expect(result).toEqual([]);
    });

    it("should return only one candidate when all candidates overlap", () => {
        const result = selectDiverseTopN(
            [
                {
                    timeRange: {
                        start: new Date("2026-02-27T09:00:00.000Z"),
                        end: new Date("2026-02-27T11:00:00.000Z"),
                    },
                    availableMemberIds: { required: ["user1"], optional: [] },
                    score: 13,
                },
                {
                    timeRange: {
                        start: new Date("2026-02-27T09:30:00.000Z"),
                        end: new Date("2026-02-27T11:30:00.000Z"),
                    },
                    availableMemberIds: { required: ["user1"], optional: [] },
                    score: 12,
                },
                {
                    timeRange: {
                        start: new Date("2026-02-27T10:00:00.000Z"),
                        end: new Date("2026-02-27T12:00:00.000Z"),
                    },
                    availableMemberIds: { required: ["user1"], optional: [] },
                    score: 11,
                },
            ],
            3,
        );

        expect(result).toHaveLength(1);
        expect(result[0].score).toBe(13);
    });
});

describe("selectPreferredAndFallbackScores", () => {
    const createScore = (
        start: string,
        end: string,
        required: string[],
        score: number,
    ) => ({
        timeRange: {
            start: new Date(start),
            end: new Date(end),
        },
        availableMemberIds: { required, optional: [] },
        score,
    });

    it("should return fallback candidates only when they improve required member availability", () => {
        const scores = [
            createScore(
                "2026-02-27T03:00:00.000Z",
                "2026-02-27T04:00:00.000Z",
                ["user1"],
                10,
            ), // JST 12:00
            createScore(
                "2026-02-27T08:00:00.000Z",
                "2026-02-27T09:00:00.000Z",
                ["user1", "user2"],
                20,
            ), // JST 17:00
        ];

        const result = selectPreferredAndFallbackScores(
            scores,
            3,
            [{ start: 12, end: 15 }],
            2,
        );

        expect(result.preferred).toHaveLength(1);
        expect(result.preferred[0].timeRange.start.toISOString()).toBe(
            "2026-02-27T03:00:00.000Z",
        );
        expect(result.fallback).toHaveLength(1);
        expect(result.fallback[0].timeRange.start.toISOString()).toBe(
            "2026-02-27T08:00:00.000Z",
        );
    });

    it("should not return fallback candidates that are far from the selected UI hour range", () => {
        const scores = [
            createScore(
                "2026-02-27T03:00:00.000Z",
                "2026-02-27T04:00:00.000Z",
                ["user1"],
                10,
            ), // JST 12:00
            createScore(
                "2026-02-27T10:00:00.000Z",
                "2026-02-27T11:00:00.000Z",
                ["user1", "user2"],
                20,
            ), // JST 19:00
        ];

        const result = selectPreferredAndFallbackScores(
            scores,
            3,
            [{ start: 12, end: 15 }],
            2,
        );

        expect(result.preferred).toHaveLength(1);
        expect(result.fallback).toHaveLength(0);
    });

    it("should include fallback candidates exactly three hours after the selected UI hour range", () => {
        const scores = [
            createScore(
                "2026-02-27T03:00:00.000Z",
                "2026-02-27T04:00:00.000Z",
                ["user1"],
                10,
            ), // JST 12:00
            createScore(
                "2026-02-27T09:00:00.000Z",
                "2026-02-27T10:00:00.000Z",
                ["user1", "user2"],
                20,
            ), // JST 18:00
        ];

        const result = selectPreferredAndFallbackScores(
            scores,
            3,
            [{ start: 12, end: 15 }],
            2,
        );

        expect(result.fallback).toHaveLength(1);
        expect(result.fallback[0].timeRange.start.toISOString()).toBe(
            "2026-02-27T09:00:00.000Z",
        );
    });

    it("should include fallback candidates that start at 22:00", () => {
        const scores = [
            createScore(
                "2026-02-27T10:00:00.000Z",
                "2026-02-27T11:00:00.000Z",
                ["user1"],
                10,
            ), // JST 19:00
            createScore(
                "2026-02-27T13:00:00.000Z",
                "2026-02-27T14:00:00.000Z",
                ["user1", "user2"],
                20,
            ), // JST 22:00
        ];

        const result = selectPreferredAndFallbackScores(
            scores,
            3,
            [{ start: 18, end: 22 }],
            2,
        );

        expect(result.fallback).toHaveLength(1);
        expect(result.fallback[0].timeRange.start.toISOString()).toBe(
            "2026-02-27T13:00:00.000Z",
        );
    });

    it("should not return late-night fallback candidates", () => {
        const scores = [
            createScore(
                "2026-02-27T10:00:00.000Z",
                "2026-02-27T11:00:00.000Z",
                ["user1"],
                10,
            ), // JST 19:00
            createScore(
                "2026-02-27T17:00:00.000Z",
                "2026-02-27T18:00:00.000Z",
                ["user1", "user2"],
                20,
            ), // JST 02:00
        ];

        const result = selectPreferredAndFallbackScores(
            scores,
            3,
            [{ start: 18, end: 22 }],
            2,
        );

        expect(result.preferred).toHaveLength(1);
        expect(result.fallback).toHaveLength(0);
    });

    it("should not return fallback candidates when required member availability does not improve", () => {
        const scores = [
            createScore(
                "2026-02-27T03:00:00.000Z",
                "2026-02-27T04:00:00.000Z",
                ["user1", "user2"],
                20,
            ), // JST 12:00
            createScore(
                "2026-02-27T10:00:00.000Z",
                "2026-02-27T11:00:00.000Z",
                ["user1", "user2"],
                23,
            ), // JST 19:00
        ];

        const result = selectPreferredAndFallbackScores(
            scores,
            3,
            [{ start: 12, end: 15 }],
            2,
        );

        expect(result.preferred).toHaveLength(1);
        expect(result.fallback).toHaveLength(0);
    });

    it("should not return fallback candidates with no required member availability when preferred candidates are empty", () => {
        const scores = [
            createScore(
                "2026-02-27T10:00:00.000Z",
                "2026-02-27T11:00:00.000Z",
                [],
                0,
            ), // JST 19:00
        ];

        const result = selectPreferredAndFallbackScores(
            scores,
            3,
            [{ start: 12, end: 15 }],
            2,
        );

        expect(result.preferred).toHaveLength(0);
        expect(result.fallback).toHaveLength(0);
    });

    it("should not return fallback candidates when no UI hour range is specified", () => {
        const scores = [
            createScore(
                "2026-02-27T03:00:00.000Z",
                "2026-02-27T04:00:00.000Z",
                ["user1"],
                10,
            ),
            createScore(
                "2026-02-27T10:00:00.000Z",
                "2026-02-27T11:00:00.000Z",
                ["user1", "user2"],
                20,
            ),
        ];

        const result = selectPreferredAndFallbackScores(
            scores,
            3,
            undefined,
            2,
        );

        expect(result.preferred).toHaveLength(2);
        expect(result.fallback).toHaveLength(0);
    });
});
