/**
 * AI Suggest 機能のスコアリングロジック
 */

import { TimeSlot, ScoredCandidate, MemberInfo } from "@/domain/ai-suggest";
import { EventTimeOfDay } from "@/domain/event";

/**
 * 空き時間を30分スロットに分割（きりの良い時間に調整）
 *
 * @param freeSlots 空き時間の配列 { start, end }
 * @returns 30分単位のスロット配列
 */
export function splitInto30MinSlots(freeSlots: { start: string; end: string }[]): string[] {
    const slots: string[] = [];
    const SLOT_DURATION_MS = 30 * 60 * 1000; // 30分

    for (const slot of freeSlots) {
        const startTime = new Date(slot.start).getTime();
        const endTime = new Date(slot.end).getTime();

        // 開始時刻を次の00分に調整
        const startDate = new Date(startTime);
        const minutes = startDate.getUTCMinutes();

        let adjustedStartTime: number;
        if (minutes === 0) {
            // 既に00分の場合、秒・ミリ秒を0にリセット
            startDate.setUTCSeconds(0, 0);
            adjustedStartTime = startDate.getTime();
        } else {
            // 00分でない場合、次の時間の00分に繰り上げ
            startDate.setUTCMinutes(0, 0, 0);
            startDate.setUTCHours(startDate.getUTCHours() + 1);
            adjustedStartTime = startDate.getTime();
        }

        // 調整後の開始時刻からスロットを生成
        let currentTime = adjustedStartTime;
        while (currentTime + SLOT_DURATION_MS <= endTime) {
            slots.push(new Date(currentTime).toISOString());
            currentTime += SLOT_DURATION_MS;
        }
    }

    return slots;
}

/**
 * 各30分スロットに対して参加可能なメンバーを集計
 *
 * @param slots 30分スロットの開始時刻配列
 * @param memberAvailability メンバーごとの空き時間 Map<userId, freeSlots>
 * @param members メンバー情報
 * @returns TimeSlot配列
 */
export function calculateSlotAvailability(
    slots: string[],
    memberAvailability: Map<string, { start: string; end: string }[]>,
    members: MemberInfo[]
): TimeSlot[] {
    const SLOT_DURATION_MS = 30 * 60 * 1000;

    return slots.map(slotStart => {
        const slotStartTime = new Date(slotStart).getTime();
        const slotEndTime = slotStartTime + SLOT_DURATION_MS;
        const slotEnd = new Date(slotEndTime).toISOString();

        // このスロットで参加可能なメンバーを集計
        const availableMembers: string[] = [];
        let score = 0;

        for (const member of members) {
            const userFreeSlots = memberAvailability.get(member.userId) || [];

            // このメンバーがこのスロットで空いているかチェック
            const isAvailable = userFreeSlots.some(freeSlot => {
                const freeStart = new Date(freeSlot.start).getTime();
                const freeEnd = new Date(freeSlot.end).getTime();

                // スロット全体がfree期間に含まれているか
                return freeStart <= slotStartTime && slotEndTime <= freeEnd;
            });

            if (isAvailable) {
                availableMembers.push(member.userId);
                // スコア計算: 必須10点、任意1点
                score += member.isRequired ? 10 : 1;
            }
        }

        return {
            start: slotStart,
            end: slotEnd,
            availableMembers,
            score
        };
    });
}

/**
 * 連続スロットを結合して候補を生成
 *
 * @param slots TimeSlot配列
 * @param durationMinutes 必要な所要時間（分）
 * @param members メンバー情報（必須メンバー判定用）
 * @returns ScoredCandidate配列
 */
export function generateCandidates(
    slots: TimeSlot[],
    durationMinutes: number,
    members: MemberInfo[]
): ScoredCandidate[] {
    const requiredMemberIds = members
        .filter(m => m.isRequired)
        .map(m => m.userId);

    const requiredSlotCount = Math.ceil(durationMinutes / 30);
    const candidates: ScoredCandidate[] = [];

    // スライディングウィンドウで連続スロットを探索（1時間刻み = 2スロット刻み）
    const step = 2; // 30分×2 = 1時間刻み
    for (let i = 0; i <= slots.length - requiredSlotCount; i += step) {
        const window = slots.slice(i, i + requiredSlotCount);

        // 連続性チェック
        const isConsecutive = window.every((slot, idx) => {
            if (idx === 0) return true;
            const prevEnd = new Date(window[idx - 1].end).getTime();
            const currStart = new Date(slot.start).getTime();
            return prevEnd === currStart;
        });

        if (!isConsecutive) continue;

        // 全スロットで共通して参加可能なメンバーを抽出
        const commonMembers = window[0].availableMembers.filter(memberId =>
            window.every(slot => slot.availableMembers.includes(memberId))
        );

        // スコア計算
        let totalScore = 0;
        let requiredCount = 0;
        let optionalCount = 0;

        for (const memberId of commonMembers) {
            const isRequired = requiredMemberIds.includes(memberId);
            if (isRequired) {
                requiredCount++;
                totalScore += 10 * requiredSlotCount;
            } else {
                optionalCount++;
                totalScore += 1 * requiredSlotCount;
            }
        }

        candidates.push({
            start: window[0].start,
            end: window[window.length - 1].end,
            totalScore,
            requiredMemberCount: requiredCount,
            optionalMemberCount: optionalCount
        });
    }

    // スコア順にソート（高い順）
    return candidates.sort((a, b) => {
        // 必須メンバー数を優先
        if (a.requiredMemberCount !== b.requiredMemberCount) {
            return b.requiredMemberCount - a.requiredMemberCount;
        }
        // 次にスコア
        return b.totalScore - a.totalScore;
    });
}

/**
 * 時間帯フィルタリング
 *
 * @param candidates ScoredCandidate配列
 * @param timeSlot 希望時間帯
 * @returns フィルタリング後のScoredCandidate配列
 */
export function filterByTimeOfDay(
    candidates: ScoredCandidate[],
    timeSlot: EventTimeOfDay
): ScoredCandidate[] {
    return candidates.filter(candidate => {
        const startDate = new Date(candidate.start);
        // JST で時刻を取得（UTC+9）
        const jstHour = startDate.getUTCHours() + 9;
        const hour = jstHour >= 24 ? jstHour - 24 : jstHour;

        switch (timeSlot) {
            case "morning":
                return hour >= 6 && hour < 12;
            case "noon":
                return hour >= 12 && hour < 16;
            case "evening":
                return hour >= 16 && hour < 19;
            case "night":
                return hour >= 19 || hour < 6;
            default:
                return true;
        }
    });
}
