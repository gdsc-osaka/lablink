import { findCommonFreeSlots } from "../availability";
import { formatFreeSlotsForAI } from "../ai-formatter";

jest.mock("../date");

describe("Calendar Availability Functions", () => {
    describe("findCommonFreeSlots", () => {
        it("空のbusyIntervalsの場合、検索期間全体を返す", () => {
            const result = findCommonFreeSlots(
                [],
                "2024-01-01T09:00:00Z",
                "2024-01-01T17:00:00Z",
            );

            expect(result).toHaveLength(1);
            expect(result[0].start.toISOString()).toBe(
                "2024-01-01T09:00:00.000Z",
            );
            expect(result[0].end.toISOString()).toBe(
                "2024-01-01T17:00:00.000Z",
            );
        });

        it("重複しないbusyIntervalsの場合、適切なfree slotsを返す", () => {
            const busyIntervals = [
                { start: "2024-01-01T10:00:00Z", end: "2024-01-01T12:00:00Z" },
                { start: "2024-01-01T14:00:00Z", end: "2024-01-01T16:00:00Z" },
            ];

            const result = findCommonFreeSlots(
                busyIntervals,
                "2024-01-01T09:00:00Z",
                "2024-01-01T17:00:00Z",
            );

            expect(result).toHaveLength(3);
            // 9:00-10:00
            expect(result[0].start.toISOString()).toBe(
                "2024-01-01T09:00:00.000Z",
            );
            expect(result[0].end.toISOString()).toBe(
                "2024-01-01T10:00:00.000Z",
            );
            // 12:00-14:00
            expect(result[1].start.toISOString()).toBe(
                "2024-01-01T12:00:00.000Z",
            );
            expect(result[1].end.toISOString()).toBe(
                "2024-01-01T14:00:00.000Z",
            );
            // 16:00-17:00
            expect(result[2].start.toISOString()).toBe(
                "2024-01-01T16:00:00.000Z",
            );
            expect(result[2].end.toISOString()).toBe(
                "2024-01-01T17:00:00.000Z",
            );
        });

        it("重複するbusyIntervalsの場合、適切にマージしてfree slotsを返す", () => {
            const busyIntervals = [
                { start: "2024-01-01T10:00:00Z", end: "2024-01-01T12:00:00Z" },
                { start: "2024-01-01T11:00:00Z", end: "2024-01-01T13:00:00Z" },
            ];

            const result = findCommonFreeSlots(
                busyIntervals,
                "2024-01-01T09:00:00Z",
                "2024-01-01T17:00:00Z",
            );

            expect(result).toHaveLength(2);
            // 9:00-10:00
            expect(result[0].start.toISOString()).toBe(
                "2024-01-01T09:00:00.000Z",
            );
            expect(result[0].end.toISOString()).toBe(
                "2024-01-01T10:00:00.000Z",
            );
            // 13:00-17:00
            expect(result[1].start.toISOString()).toBe(
                "2024-01-01T13:00:00.000Z",
            );
            expect(result[1].end.toISOString()).toBe(
                "2024-01-01T17:00:00.000Z",
            );
        });

        it("検索期間外のbusyIntervalsは無視される", () => {
            const busyIntervals = [
                { start: "2024-01-01T08:00:00Z", end: "2024-01-01T09:00:00Z" },
                { start: "2024-01-01T10:00:00Z", end: "2024-01-01T12:00:00Z" },
                { start: "2024-01-01T18:00:00Z", end: "2024-01-01T19:00:00Z" },
            ];

            const result = findCommonFreeSlots(
                busyIntervals,
                "2024-01-01T09:00:00Z",
                "2024-01-01T17:00:00Z",
            );

            expect(result).toHaveLength(2);
            // 9:00-10:00
            expect(result[0].start.toISOString()).toBe(
                "2024-01-01T09:00:00.000Z",
            );
            expect(result[0].end.toISOString()).toBe(
                "2024-01-01T10:00:00.000Z",
            );
            // 12:00-17:00
            expect(result[1].start.toISOString()).toBe(
                "2024-01-01T12:00:00.000Z",
            );
            expect(result[1].end.toISOString()).toBe(
                "2024-01-01T17:00:00.000Z",
            );
        });
    });

    describe("formatFreeSlotsForAI", () => {
        it("空のfreeSlotsの場合、適切なメッセージを返す", () => {
            const result = formatFreeSlotsForAI([]);
            expect(result).toBe(
                "利用可能な共通の空き時間帯はありませんでした。",
            );
        });

        it("freeSlotsがある場合、適切にフォーマットされた文字列を返す", () => {
            const freeSlots = [
                {
                    start: new Date("2024-01-01T09:00:00Z"),
                    end: new Date("2024-01-01T10:00:00Z"),
                },
                {
                    start: new Date("2024-01-01T14:00:00Z"),
                    end: new Date("2024-01-01T16:00:00Z"),
                },
            ];

            const result = formatFreeSlotsForAI(freeSlots);

            expect(result).toContain("利用可能な共通の空き時間帯リスト:");
            expect(result).toContain("1月1日");
            expect(result).toContain("9:0 から 10:0 まで");
            expect(result).toContain("14:0 から 16:0 まで");
        });
    });
});
