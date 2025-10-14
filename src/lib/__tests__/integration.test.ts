import { findCommonFreeSlots } from "../availability";
import { formatFreeSlotsForAI } from "../ai-formatter";

jest.mock("../date");

describe("Integration Tests", () => {
    it("複数ユーザーのカレンダーから共通の空き時間を正しく計算できる", () => {
        // 複数ユーザーの予定データをシミュレート
        const user1Busy = [
            { start: "2024-01-01T09:00:00Z", end: "2024-01-01T11:00:00Z" },
            { start: "2024-01-01T14:00:00Z", end: "2024-01-01T16:00:00Z" },
        ];

        const user2Busy = [
            { start: "2024-01-01T10:00:00Z", end: "2024-01-01T12:00:00Z" },
            { start: "2024-01-01T15:00:00Z", end: "2024-01-01T17:00:00Z" },
        ];

        const user3Busy = [
            { start: "2024-01-01T08:00:00Z", end: "2024-01-01T10:00:00Z" },
            { start: "2024-01-01T13:00:00Z", end: "2024-01-01T15:00:00Z" },
        ];

        // 全ユーザーの予定を統合
        const allBusyIntervals = [...user1Busy, ...user2Busy, ...user3Busy];

        // 共通の空き時間を計算
        const freeSlots = findCommonFreeSlots(
            allBusyIntervals,
            "2024-01-01T08:00:00Z",
            "2024-01-01T18:00:00Z",
        );

        // 結果を検証
        expect(freeSlots.length).toBeGreaterThan(0);

        // 空き時間が予定と重複していないことを確認
        for (const freeSlot of freeSlots) {
            for (const busyInterval of allBusyIntervals) {
                const busyStart = new Date(busyInterval.start);
                const busyEnd = new Date(busyInterval.end);

                // 空き時間が予定と重複していないことを確認
                expect(
                    freeSlot.start >= busyEnd || freeSlot.end <= busyStart,
                ).toBe(true);
            }
        }

        // AI用フォーマットが正しく動作することを確認
        const formattedText = formatFreeSlotsForAI(freeSlots);
        expect(formattedText).toContain("利用可能な共通の空き時間帯リスト:");
        expect(formattedText).toContain("から");
        expect(formattedText).toContain("まで");
    });

    it("複雑な予定パターンでも正しく空き時間を計算できる", () => {
        // より複雑な予定パターン（連続する空き時間を生成）
        const complexBusyIntervals = [
            { start: "2024-01-01T09:00:00Z", end: "2024-01-01T11:00:00Z" }, // 9:00-11:00
            { start: "2024-01-01T13:00:00Z", end: "2024-01-01T15:00:00Z" }, // 13:00-15:00
            { start: "2024-01-01T17:00:00Z", end: "2024-01-01T19:00:00Z" }, // 17:00-19:00
        ];

        const freeSlots = findCommonFreeSlots(
            complexBusyIntervals,
            "2024-01-01T08:00:00Z",
            "2024-01-01T17:00:00Z",
        );

        // 結果を検証
        expect(freeSlots.length).toBeGreaterThan(0);

        // 空き時間の基本的な検証のみを行う
        expect(freeSlots.length).toBeGreaterThan(0);

        // 最初の空き時間が検索開始時刻から始まることを確認
        expect(freeSlots[0].start.toISOString()).toBe(
            "2024-01-01T08:00:00.000Z",
        );

        // 最後の空き時間が検索終了時刻で終わることを確認
        expect(freeSlots[freeSlots.length - 1].end.toISOString()).toBe(
            "2024-01-01T17:00:00.000Z",
        );
    });

    it("境界値の処理が正しく動作する", () => {
        // 検索期間の境界にぴったり予定がある場合
        const boundaryBusyIntervals = [
            { start: "2024-01-01T09:00:00Z", end: "2024-01-01T09:00:00Z" }, // 開始時刻
            { start: "2024-01-01T17:00:00Z", end: "2024-01-01T17:00:00Z" }, // 終了時刻
        ];

        const freeSlots = findCommonFreeSlots(
            boundaryBusyIntervals,
            "2024-01-01T09:00:00Z",
            "2024-01-01T17:00:00Z",
        );

        // 境界値の予定は無視されるべき
        expect(freeSlots.length).toBe(1);
        expect(freeSlots[0].start.toISOString()).toBe(
            "2024-01-01T09:00:00.000Z",
        );
        expect(freeSlots[0].end.toISOString()).toBe("2024-01-01T17:00:00.000Z");
    });
});
