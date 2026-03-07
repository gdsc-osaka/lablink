vi.mock("server-only", () => ({}));
import { generatePrompt } from "../schedule-suggestion-service";

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
