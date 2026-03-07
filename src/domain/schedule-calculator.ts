import { TimeRange, UserTimeRanges } from "./calendar";
import { User } from "./user";

/**
 * イベントの参加者情報
 */
export interface EventMember extends User {
    /** 必須参加者かどうか */
    isRequired: boolean;
}

export const MEMBER_REQUIRED_SCORE = 10;
export const MEMBER_OPTIONAL_SCORE = 1;

/**
 * 時間帯ごとの参加可能なユーザーとスコア
 */
export interface TimeRangeScore {
    /** 時間帯 */
    timeRange: TimeRange;
    /** このスロットで参加可能なメンバー */
    availableMemberIds: {
        required: string[];
        optional: string[];
    };
    /** スコア */
    score: number;
}

/**
 * 指定された時間帯に、指定された間隔でタイムスロットを作成する。
 * @param timeRange 時間帯
 * @param durationMinutes スロットの長さ（分）
 * @param intervalMinutes スロットの開始時刻の間隔（分）
 * @returns タイムスロット
 *
 * @example
 * createSlots({ start: new Date("2026-02-27T09:00:00"), end: new Date("2026-02-27T12:00:00") }, 60, 30)
 * // [
 * //   { start: new Date("2026-02-27T09:00:00"), end: new Date("2026-02-27T10:00:00") },
 * //   { start: new Date("2026-02-27T09:30:00"), end: new Date("2026-02-27T10:30:00") },
 * //   { start: new Date("2026-02-27T10:00:00"), end: new Date("2026-02-27T11:00:00") },
 * //   { start: new Date("2026-02-27T10:30:00"), end: new Date("2026-02-27T11:30:00") },
 * //   { start: new Date("2026-02-27T11:00:00"), end: new Date("2026-02-27T12:00:00") },
 * // ]
 */
export const createSlots = (
    timeRange: TimeRange,
    durationMinutes: number,
    intervalMinutes: number,
): TimeRange[] => {
    const slots: TimeRange[] = [];
    const slotDurationMs = durationMinutes * 60 * 1000;
    const slotIntervalMs = intervalMinutes * 60 * 1000;

    let currentStart = timeRange.start;

    while (true) {
        const currentEnd = new Date(currentStart.getTime() + slotDurationMs);
        if (currentEnd > timeRange.end) {
            break;
        }

        slots.push({
            start: currentStart,
            end: currentEnd,
        });

        currentStart = new Date(currentStart.getTime() + slotIntervalMs);
    }

    return slots;
};

/**
 * 指定された時間帯の中で、参加可能なメンバーを集計
 *
 * @param timeRange 時間帯
 * @param durationMinutes イベントの所要時間（分）
 * @param memberAvailability メンバーごとの空き時間 Map<userId, freeSlots>
 * @param members メンバー情報
 * @returns スロットごとのスコア
 */
export const calculateTimeRangeScores = (
    timeRange: TimeRange,
    durationMinutes: number,
    memberAvailability: UserTimeRanges[],
    members: EventMember[],
): TimeRangeScore[] => {
    const slots: TimeRangeScore[] = createSlots(
        timeRange,
        durationMinutes,
        30, // TODO: 開始時刻の間隔は 30 分で固定で良いか？
    ).map((slot) => ({
        timeRange: slot,
        availableMemberIds: {
            required: [],
            optional: [],
        },
        score: 0,
    }));

    for (const availability of memberAvailability) {
        const userFreeSlots = availability.timeRanges;
        const member = members.find((m) => m.id === availability.userId);
        if (!member) continue;

        for (const slot of slots) {
            const slotStartTime = slot.timeRange.start;
            const slotEndTime = slot.timeRange.end;

            // このメンバーがこのスロットで空いているかチェック
            const isAvailable = userFreeSlots.some((freeSlot) => {
                const freeStart = new Date(freeSlot.start);
                const freeEnd = new Date(freeSlot.end);

                // スロット全体がfree期間に含まれているか
                return freeStart <= slotStartTime && slotEndTime <= freeEnd;
            });

            if (isAvailable) {
                if (member.isRequired) {
                    slot.availableMemberIds.required.push(member.id);
                    slot.score += MEMBER_REQUIRED_SCORE;
                } else {
                    slot.availableMemberIds.optional.push(member.id);
                    slot.score += MEMBER_OPTIONAL_SCORE;
                }
            }
        }
    }

    return slots;
};
