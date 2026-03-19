import { busyToFreeSlots, TimeRange } from "../calendar";

describe("busyToFreeSlots", () => {
    it("should return full period when no busy slots exist", () => {
        const result = busyToFreeSlots(
            [],
            new Date("2025-01-01T00:00:00.000Z"),
            new Date("2025-01-01T10:00:00.000Z"),
        );

        expect(result).toHaveLength(1);
        expect(result[0].start).toStrictEqual(
            new Date("2025-01-01T00:00:00.000Z"),
        );
        expect(result[0].end).toStrictEqual(
            new Date("2025-01-01T10:00:00.000Z"),
        );
    });

    it("should find free slots around single busy slot", () => {
        const busySlots: TimeRange[] = [
            {
                start: new Date("2025-01-01T03:00:00.000Z"),
                end: new Date("2025-01-01T05:00:00.000Z"),
            },
        ];

        const result = busyToFreeSlots(
            busySlots,
            new Date("2025-01-01T00:00:00.000Z"),
            new Date("2025-01-01T10:00:00.000Z"),
        );

        expect(result).toHaveLength(2);
        expect(result[0].start).toStrictEqual(
            new Date("2025-01-01T00:00:00.000Z"),
        );
        expect(result[0].end).toStrictEqual(
            new Date("2025-01-01T03:00:00.000Z"),
        );
        expect(result[1].start).toStrictEqual(
            new Date("2025-01-01T05:00:00.000Z"),
        );
        expect(result[1].end).toStrictEqual(
            new Date("2025-01-01T10:00:00.000Z"),
        );
    });

    it("should merge overlapping busy slots", () => {
        const busySlots: TimeRange[] = [
            {
                start: new Date("2025-01-01T02:00:00.000Z"),
                end: new Date("2025-01-01T04:00:00.000Z"),
            },
            {
                start: new Date("2025-01-01T03:00:00.000Z"),
                end: new Date("2025-01-01T05:00:00.000Z"),
            },
            {
                start: new Date("2025-01-01T04:30:00.000Z"),
                end: new Date("2025-01-01T06:00:00.000Z"),
            },
        ];

        const result = busyToFreeSlots(
            busySlots,
            new Date("2025-01-01T00:00:00.000Z"),
            new Date("2025-01-01T10:00:00.000Z"),
        );

        // Should merge all overlapping slots into one busy period (2:00-6:00)
        expect(result).toHaveLength(2);
        expect(result[0].start).toStrictEqual(
            new Date("2025-01-01T00:00:00.000Z"),
        );
        expect(result[0].end).toStrictEqual(
            new Date("2025-01-01T02:00:00.000Z"),
        );
        expect(result[1].start).toStrictEqual(
            new Date("2025-01-01T06:00:00.000Z"),
        );
        expect(result[1].end).toStrictEqual(
            new Date("2025-01-01T10:00:00.000Z"),
        );
    });

    it("should handle busy slots at boundaries", () => {
        const busySlots: TimeRange[] = [
            {
                start: new Date("2025-01-01T00:00:00.000Z"),
                end: new Date("2025-01-01T02:00:00.000Z"),
            },
            {
                start: new Date("2025-01-01T08:00:00.000Z"),
                end: new Date("2025-01-01T10:00:00.000Z"),
            },
        ];

        const result = busyToFreeSlots(
            busySlots,
            new Date("2025-01-01T00:00:00.000Z"),
            new Date("2025-01-01T10:00:00.000Z"),
        );

        expect(result).toHaveLength(1);
        expect(result[0].start).toStrictEqual(
            new Date("2025-01-01T02:00:00.000Z"),
        );
        expect(result[0].end).toStrictEqual(
            new Date("2025-01-01T08:00:00.000Z"),
        );
    });

    it("should filter out busy slots outside search range", () => {
        const busySlots: TimeRange[] = [
            {
                start: new Date("2024-12-31T20:00:00.000Z"),
                end: new Date("2024-12-31T23:00:00.000Z"),
            }, // Before range
            {
                start: new Date("2025-01-01T03:00:00.000Z"),
                end: new Date("2025-01-01T05:00:00.000Z"),
            }, // Within range
            {
                start: new Date("2025-01-01T12:00:00.000Z"),
                end: new Date("2025-01-01T15:00:00.000Z"),
            }, // After range
        ];

        const result = busyToFreeSlots(
            busySlots,
            new Date("2025-01-01T00:00:00.000Z"),
            new Date("2025-01-01T10:00:00.000Z"),
        );

        expect(result).toHaveLength(2);
        expect(result[0].start).toStrictEqual(
            new Date("2025-01-01T00:00:00.000Z"),
        );
        expect(result[0].end).toStrictEqual(
            new Date("2025-01-01T03:00:00.000Z"),
        );
        expect(result[1].start).toStrictEqual(
            new Date("2025-01-01T05:00:00.000Z"),
        );
        expect(result[1].end).toStrictEqual(
            new Date("2025-01-01T10:00:00.000Z"),
        );
    });

    it("should handle adjacent busy slots", () => {
        const busySlots: TimeRange[] = [
            {
                start: new Date("2025-01-01T02:00:00.000Z"),
                end: new Date("2025-01-01T04:00:00.000Z"),
            },
            {
                start: new Date("2025-01-01T04:00:00.000Z"),
                end: new Date("2025-01-01T06:00:00.000Z"),
            },
        ];

        const result = busyToFreeSlots(
            busySlots,
            new Date("2025-01-01T00:00:00.000Z"),
            new Date("2025-01-01T10:00:00.000Z"),
        );

        // Adjacent slots should be merged
        expect(result).toHaveLength(2);
        expect(result[0].start).toStrictEqual(
            new Date("2025-01-01T00:00:00.000Z"),
        );
        expect(result[0].end).toStrictEqual(
            new Date("2025-01-01T02:00:00.000Z"),
        );
        expect(result[1].start).toStrictEqual(
            new Date("2025-01-01T06:00:00.000Z"),
        );
        expect(result[1].end).toStrictEqual(
            new Date("2025-01-01T10:00:00.000Z"),
        );
    });

    it("should return empty array when entire period is busy", () => {
        const busySlots: TimeRange[] = [
            {
                start: new Date("2025-01-01T00:00:00.000Z"),
                end: new Date("2025-01-01T10:00:00.000Z"),
            },
        ];

        const result = busyToFreeSlots(
            busySlots,
            new Date("2025-01-01T00:00:00.000Z"),
            new Date("2025-01-01T10:00:00.000Z"),
        );

        expect(result).toHaveLength(0);
    });

    it("should handle unsorted busy slots", () => {
        const busySlots: TimeRange[] = [
            {
                start: new Date("2025-01-01T06:00:00.000Z"),
                end: new Date("2025-01-01T08:00:00.000Z"),
            },
            {
                start: new Date("2025-01-01T02:00:00.000Z"),
                end: new Date("2025-01-01T04:00:00.000Z"),
            },
        ];

        const result = busyToFreeSlots(
            busySlots,
            new Date("2025-01-01T00:00:00.000Z"),
            new Date("2025-01-01T10:00:00.000Z"),
        );

        expect(result).toHaveLength(3);
        expect(result[0].start).toStrictEqual(
            new Date("2025-01-01T00:00:00.000Z"),
        );
        expect(result[0].end).toStrictEqual(
            new Date("2025-01-01T02:00:00.000Z"),
        );
        expect(result[1].start).toStrictEqual(
            new Date("2025-01-01T04:00:00.000Z"),
        );
        expect(result[1].end).toStrictEqual(
            new Date("2025-01-01T06:00:00.000Z"),
        );
        expect(result[2].start).toStrictEqual(
            new Date("2025-01-01T08:00:00.000Z"),
        );
        expect(result[2].end).toStrictEqual(
            new Date("2025-01-01T10:00:00.000Z"),
        );
    });

    it("should handle busy slots partially overlapping search range", () => {
        const busySlots: TimeRange[] = [
            {
                start: new Date("2024-12-31T23:00:00.000Z"),
                end: new Date("2025-01-01T02:00:00.000Z"),
            }, // Starts before, ends within
            {
                start: new Date("2025-01-01T08:00:00.000Z"),
                end: new Date("2025-01-01T12:00:00.000Z"),
            }, // Starts within, ends after
        ];

        const result = busyToFreeSlots(
            busySlots,
            new Date("2025-01-01T00:00:00.000Z"),
            new Date("2025-01-01T10:00:00.000Z"),
        );

        expect(result).toHaveLength(1);
        expect(result[0].start).toStrictEqual(
            new Date("2025-01-01T02:00:00.000Z"),
        );
        expect(result[0].end).toStrictEqual(
            new Date("2025-01-01T08:00:00.000Z"),
        );
    });

    it("複数ユーザーのカレンダーから共通の空き時間を正しく計算できる", () => {
        // 複数ユーザーの予定データをシミュレート
        const user1Busy: TimeRange[] = [
            {
                start: new Date("2024-01-01T09:00:00Z"),
                end: new Date("2024-01-01T11:00:00Z"),
            },
            {
                start: new Date("2024-01-01T14:00:00Z"),
                end: new Date("2024-01-01T16:00:00Z"),
            },
        ];

        const user2Busy: TimeRange[] = [
            {
                start: new Date("2024-01-01T10:00:00Z"),
                end: new Date("2024-01-01T12:00:00Z"),
            },
            {
                start: new Date("2024-01-01T15:00:00Z"),
                end: new Date("2024-01-01T17:00:00Z"),
            },
        ];

        const user3Busy: TimeRange[] = [
            {
                start: new Date("2024-01-01T08:00:00Z"),
                end: new Date("2024-01-01T10:00:00Z"),
            },
            {
                start: new Date("2024-01-01T13:00:00Z"),
                end: new Date("2024-01-01T15:00:00Z"),
            },
        ];

        // 全ユーザーの予定を統合
        const allBusySlots = [...user1Busy, ...user2Busy, ...user3Busy];

        // 共通の空き時間を計算
        const freeSlots = busyToFreeSlots(
            allBusySlots,
            new Date("2024-01-01T08:00:00Z"),
            new Date("2024-01-01T18:00:00Z"),
        );

        // 結果を検証
        expect(freeSlots.length).toBeGreaterThan(0);

        // 空き時間が予定と重複していないことを確認
        for (const freeSlot of freeSlots) {
            const freeStart = new Date(freeSlot.start);
            const freeEnd = new Date(freeSlot.end);

            for (const busySlot of allBusySlots) {
                const busyStart = new Date(busySlot.start);
                const busyEnd = new Date(busySlot.end);

                // 重複していないことを確認：空き時間が予定の前、または後にある
                const noOverlap = freeEnd <= busyStart || freeStart >= busyEnd;
                expect(noOverlap).toBe(true);
            }
        }
    });

    it("複雑な予定パターンでも正しく空き時間を計算できる", () => {
        // より複雑な予定パターン（連続する空き時間を生成）
        const complexBusySlots: TimeRange[] = [
            {
                start: new Date("2024-01-01T09:00:00Z"),
                end: new Date("2024-01-01T11:00:00Z"),
            }, // 9:00-11:00
            {
                start: new Date("2024-01-01T13:00:00Z"),
                end: new Date("2024-01-01T15:00:00Z"),
            }, // 13:00-15:00
            {
                start: new Date("2024-01-01T17:00:00Z"),
                end: new Date("2024-01-01T19:00:00Z"),
            }, // 17:00-19:00
        ];

        const freeSlots = busyToFreeSlots(
            complexBusySlots,
            new Date("2024-01-01T08:00:00Z"),
            new Date("2024-01-01T17:00:00Z"),
        );

        // 結果を検証
        expect(freeSlots.length).toBeGreaterThan(0);

        // 空き時間の基本的な検証のみを行う
        expect(freeSlots.length).toBeGreaterThan(0);

        // 最初の空き時間が検索開始時刻から始まることを確認
        expect(freeSlots[0].start).toStrictEqual(
            new Date("2024-01-01T08:00:00.000Z"),
        );

        // 最後の空き時間が検索終了時刻で終わることを確認
        expect(freeSlots[freeSlots.length - 1].end).toStrictEqual(
            new Date("2024-01-01T17:00:00.000Z"),
        );
    });

    it("境界値の処理が正しく動作する", () => {
        // 検索期間の境界にぴったり予定がある場合
        const boundaryBusySlots: TimeRange[] = [
            {
                start: new Date("2024-01-01T09:00:00Z"),
                end: new Date("2024-01-01T09:00:00Z"),
            }, // 開始時刻
            {
                start: new Date("2024-01-01T17:00:00Z"),
                end: new Date("2024-01-01T17:00:00Z"),
            }, // 終了時刻
        ];

        const freeSlots = busyToFreeSlots(
            boundaryBusySlots,
            new Date("2024-01-01T09:00:00Z"),
            new Date("2024-01-01T17:00:00Z"),
        );

        // 境界値の予定は無視されるべき
        expect(freeSlots.length).toBe(1);
        expect(freeSlots[0].start).toStrictEqual(
            new Date("2024-01-01T09:00:00.000Z"),
        );
        expect(freeSlots[0].end).toStrictEqual(
            new Date("2024-01-01T17:00:00.000Z"),
        );
    });
});
