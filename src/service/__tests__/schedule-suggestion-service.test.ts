vi.mock("server-only", () => ({}));
import {
    generatePrompt,
    createScheduleSuggestionService,
} from "../schedule-suggestion-service";
import { GenAIRepository, GenAIUnknownError } from "@/domain/gen-ai";
import { okAsync, errAsync } from "neverthrow";
import { TimeRangeScore } from "@/domain/schedule-calculator";

describe("generatePrompt", () => {
    it("should format candidates and properly insert standard text", () => {
        const candidates = [
            {
                timeRange: {
                    start: new Date("2026-02-27T09:00:00.000Z"), // UTC -> 18:00 JST
                    end: new Date("2026-02-27T10:00:00.000Z"), // UTC -> 19:00 JST
                },
                availableMemberIds: {
                    required: ["user1"],
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

describe("ScheduleSuggestionService", () => {
    let mockGenAIRepo: import("vitest").Mocked<GenAIRepository>;

    beforeEach(() => {
        mockGenAIRepo = {
            generateText: vi.fn(),
            generateStructured: vi.fn(),
        } as import("vitest").Mocked<GenAIRepository>;
    });

    describe("suggestSchedule", () => {
        it("should call genAIRepository and return formatted suggestions on success", async () => {
            const mockResponse = {
                suggestions: [
                    {
                        start: "2026-02-27T09:00:00.000Z",
                        end: "2026-02-27T10:00:00.000Z",
                        reason: "金曜日の18時はイベントの目的に適した時間帯です。",
                    },
                ],
            };

            // Mock successful response from GenAI repository
            mockGenAIRepo.generateStructured.mockReturnValue(
                okAsync(mockResponse),
            );

            const service = createScheduleSuggestionService(mockGenAIRepo);

            const scores: TimeRangeScore[] = [
                {
                    timeRange: {
                        start: new Date("2026-02-27T09:00:00.000Z"),
                        end: new Date("2026-02-27T10:00:00.000Z"),
                    },
                    availableMemberIds: { required: ["user1"], optional: [] },
                    score: 10,
                },
            ];

            const result = await service.suggestSchedule(
                "Test Event",
                scores,
                1,
            );

            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toHaveLength(1);
                expect(result.value[0].timeRange.start).toBeInstanceOf(Date);
                expect(result.value[0].timeRange.start.toISOString()).toBe(
                    "2026-02-27T09:00:00.000Z",
                );
                expect(result.value[0].timeRange.end.toISOString()).toBe(
                    "2026-02-27T10:00:00.000Z",
                );
                expect(result.value[0].reason).toBe(
                    mockResponse.suggestions[0].reason,
                );
            }

            expect(mockGenAIRepo.generateStructured).toHaveBeenCalledTimes(1);
            // First argument is the generated prompt
            const callArgs = mockGenAIRepo.generateStructured.mock.calls[0];
            expect(callArgs[0]).toContain("Test Event");
            expect(callArgs[0]).toContain("2026-02-27T09:00:00.000Z");
            // Second argument is the zod schema
            expect(callArgs[1]).toBeDefined();
        });

        it("should forward GenAI error when the model fails to generate", async () => {
            mockGenAIRepo.generateStructured.mockReturnValue(
                errAsync(
                    GenAIUnknownError("Failed to connect", {
                        extra: { impl: "test" },
                    }),
                ),
            );

            const service = createScheduleSuggestionService(mockGenAIRepo);

            const scores: TimeRangeScore[] = [
                {
                    timeRange: {
                        start: new Date("2026-02-27T09:00:00.000Z"),
                        end: new Date("2026-02-27T10:00:00.000Z"),
                    },
                    availableMemberIds: { required: ["user1"], optional: [] },
                    score: 10,
                },
            ];

            const result = await service.suggestSchedule(
                "Test Event",
                scores,
                1,
            );

            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(GenAIUnknownError.isFn(result.error)).toBe(true);
            }
        });
    });
});
