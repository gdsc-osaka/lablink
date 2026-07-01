import { TimeRange, UserTimeRanges } from "./calendar";
import { User } from "./user";
import * as z from "zod";

/**
 * イベントの参加者情報
 */
export interface EventMember extends User {
    /** 必須参加者かどうか */
    isRequired: boolean;
}

export const MEMBER_REQUIRED_SCORE = 10;
export const MEMBER_OPTIONAL_SCORE = 1;
export const SCHEDULE_PREFERENCE_DAY_SCORE = 1;
export const SCHEDULE_PREFERENCE_HOUR_RANGE_SCORE = 2;
const FALLBACK_CANDIDATE_MIN_START_HOUR = 8;
const FALLBACK_CANDIDATE_MAX_START_HOUR = 22;
const FALLBACK_CANDIDATE_MAX_END_HOUR = FALLBACK_CANDIDATE_MAX_START_HOUR + 1;
const FALLBACK_CANDIDATE_HOUR_RANGE_PADDING = 3;

export const SCHEDULE_PREFERENCE_DAY_OF_WEEK_VALUES = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
] as const;

export const SchedulePreferenceDayOfWeekSchema = z.enum(
    SCHEDULE_PREFERENCE_DAY_OF_WEEK_VALUES,
);

export const SchedulePreferenceReasonSchema = z.string().min(1).max(160);

export const SchedulePreferenceDaySchema = z.object({
    dayOfWeek: SchedulePreferenceDayOfWeekSchema.describe(
        "Preferred day of week for the event.",
    ),
    reason: SchedulePreferenceReasonSchema.describe(
        "Why this day of week fits the event description.",
    ),
});

export const SchedulePreferenceHourRangeSchema = z.object({
    startHour: z.number().int().min(0).max(23).describe("Start hour in JST."),
    durationHours: z
        .number()
        .int()
        .min(1)
        .max(24)
        .describe(
            "Duration of the preferred hour range in hours. The range may cross midnight.",
        ),
    reason: SchedulePreferenceReasonSchema.describe(
        "Why this JST hour range fits the event description.",
    ),
});

export const SchedulePreferenceSchema = z.object({
    dayWeights: z.array(SchedulePreferenceDaySchema).min(0).max(7),
    hourRangeWeights: z
        .array(SchedulePreferenceHourRangeSchema)
        .min(0)
        .max(4)
        .describe(
            "Preferred JST hour ranges represented by startHour and durationHours. Keep this to the main candidate ranges.",
        ),
    summary: z.string().min(1).max(240),
});

export type SchedulePreferenceDayOfWeek = z.infer<
    typeof SchedulePreferenceDayOfWeekSchema
>;

export type SchedulePreferenceDay = z.infer<typeof SchedulePreferenceDaySchema>;

export type SchedulePreferenceHourRange = z.infer<
    typeof SchedulePreferenceHourRangeSchema
>;

export type SchedulePreference = z.infer<typeof SchedulePreferenceSchema>;

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

export interface PreferredFallbackScoreSections {
    preferred: TimeRangeScore[];
    fallback: TimeRangeScore[];
}

/**
 * 指定された時間帯に、指定された間隔でタイムスロットを作成する。
 * @param timeRange 時間帯
 * @param durationMinutes スロットの長さ（分）
 * @param intervalMinutes スロットの開始時刻の間隔（分）
 * @param allowedHourRanges 許可する時間帯（JST）の配列。指定時、開始時刻がいずれの範囲にも
 *                          含まれないスロットは生成しない。未指定の場合は全時間帯を対象とする。
 *                          各範囲は [start, end) で半開区間。例: { start: 8, end: 12 } → 8:00〜11:59
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
    allowedHourRanges?: { start: number; end: number }[],
): TimeRange[] => {
    if (durationMinutes <= 0) {
        throw new RangeError(
            `durationMinutes must be strictly positive, but got ${durationMinutes}`,
        );
    }
    if (intervalMinutes <= 0) {
        throw new RangeError(
            `intervalMinutes must be strictly positive, but got ${intervalMinutes}`,
        );
    }
    if (timeRange.start >= timeRange.end) {
        throw new RangeError(
            `timeRange.start (${timeRange.start.toISOString()}) must be strictly before timeRange.end (${timeRange.end.toISOString()})`,
        );
    }

    const slots: TimeRange[] = [];
    const slotDurationMs = durationMinutes * 60 * 1000;
    const slotIntervalMs = intervalMinutes * 60 * 1000;

    let currentStart = timeRange.start;

    while (true) {
        const currentEnd = new Date(currentStart.getTime() + slotDurationMs);
        if (currentEnd > timeRange.end) {
            break;
        }

        // 時間帯フィルタ: 指定されている場合、開始時刻（JST）がいずれかの
        // 許可範囲に含まれるスロットのみ生成する
        if (allowedHourRanges) {
            if (
                !isTimeRangeStartInAllowedHourRanges(
                    { start: currentStart, end: currentEnd },
                    allowedHourRanges,
                )
            ) {
                currentStart = new Date(
                    currentStart.getTime() + slotIntervalMs,
                );
                continue;
            }
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
    slotIntervalMinutes: number = 30,
    allowedHourRanges?: { start: number; end: number }[],
    schedulePreference?: SchedulePreference,
): TimeRangeScore[] => {
    const slots: TimeRangeScore[] = createSlots(
        timeRange,
        durationMinutes,
        slotIntervalMinutes,
        allowedHourRanges,
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
        const member = members.find((m) => m.uid === availability.userId);
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
                    slot.availableMemberIds.required.push(member.uid);
                    slot.score += MEMBER_REQUIRED_SCORE;
                } else {
                    slot.availableMemberIds.optional.push(member.uid);
                    slot.score += MEMBER_OPTIONAL_SCORE;
                }
            }
        }
    }

    if (schedulePreference) {
        for (const slot of slots) {
            slot.score += calculateSchedulePreferenceScore(
                slot.timeRange,
                schedulePreference,
            );
        }
    }

    return slots;
};

export const calculateSchedulePreferenceScore = (
    timeRange: TimeRange,
    schedulePreference: SchedulePreference,
): number => {
    const start = timeRange.start;
    const dayScore = matchesPreferredDay(start, schedulePreference)
        ? SCHEDULE_PREFERENCE_DAY_SCORE
        : 0;
    const hourRangeScore = findMatchingPreferredHourRange(
        timeRange,
        schedulePreference,
    )
        ? SCHEDULE_PREFERENCE_HOUR_RANGE_SCORE
        : 0;

    return dayScore + hourRangeScore;
};

export const findMatchingPreferredHourRange = (
    timeRange: TimeRange,
    schedulePreference: SchedulePreference,
): SchedulePreferenceHourRange | undefined =>
    schedulePreference.hourRangeWeights.find((range) =>
        containsWholeTimeRange(timeRange, range),
    );

export const selectDiverseTopN = (
    scores: TimeRangeScore[],
    n: number,
): TimeRangeScore[] => {
    if (n <= 0) return [];

    const selected: TimeRangeScore[] = [];

    for (const candidate of [...scores].sort((a, b) => b.score - a.score)) {
        if (selected.length >= n) break;

        const overlapsWithSelected = selected.some((selectedScore) =>
            timeRangesOverlap(candidate.timeRange, selectedScore.timeRange),
        );
        if (!overlapsWithSelected) {
            selected.push(candidate);
        }
    }

    return selected;
};

export const selectPreferredAndFallbackScores = (
    scores: TimeRangeScore[],
    n: number,
    allowedHourRanges: { start: number; end: number }[] | undefined,
    requiredCount: number,
): PreferredFallbackScoreSections => {
    const hasHourRangeConstraint =
        allowedHourRanges !== undefined && allowedHourRanges.length > 0;
    const preferredCandidates = hasHourRangeConstraint
        ? scores.filter((score) =>
              isTimeRangeStartInAllowedHourRanges(
                  score.timeRange,
                  allowedHourRanges,
              ),
          )
        : scores;
    const preferred = selectDiverseTopN(preferredCandidates, n);

    if (!hasHourRangeConstraint || requiredCount === 0) {
        return { preferred, fallback: [] };
    }

    const maxPreferredRequiredCount =
        preferred.length > 0
            ? Math.max(
                  ...preferred.map(
                      (score) => score.availableMemberIds.required.length,
                  ),
              )
            : 0;
    const fallbackAllowedHourRanges =
        createFallbackAllowedHourRanges(allowedHourRanges);
    const fallbackCandidates = scores.filter(
        (score) =>
            !isTimeRangeStartInAllowedHourRanges(
                score.timeRange,
                allowedHourRanges,
            ) &&
            isTimeRangeStartInAllowedHourRanges(
                score.timeRange,
                fallbackAllowedHourRanges,
            ) &&
            score.availableMemberIds.required.length >
                maxPreferredRequiredCount,
    );

    return {
        preferred,
        fallback: selectDiverseTopN(fallbackCandidates, n),
    };
};

export const isTimeRangeStartInAllowedHourRanges = (
    timeRange: TimeRange,
    allowedHourRanges: { start: number; end: number }[] | undefined,
): boolean => {
    if (!allowedHourRanges || allowedHourRanges.length === 0) {
        return true;
    }

    const hourJST = getJSTHour(timeRange.start);
    return allowedHourRanges.some(
        (range) => hourJST >= range.start && hourJST < range.end,
    );
};

const createFallbackAllowedHourRanges = (
    allowedHourRanges: { start: number; end: number }[],
): { start: number; end: number }[] =>
    mergeHourRanges(
        allowedHourRanges.flatMap((range) => {
            const start = Math.max(
                FALLBACK_CANDIDATE_MIN_START_HOUR,
                range.start - FALLBACK_CANDIDATE_HOUR_RANGE_PADDING,
            );
            const end = Math.min(
                FALLBACK_CANDIDATE_MAX_END_HOUR,
                range.end + FALLBACK_CANDIDATE_HOUR_RANGE_PADDING + 1,
            );

            return start < end ? [{ start, end }] : [];
        }),
    );

const mergeHourRanges = (
    ranges: { start: number; end: number }[],
): { start: number; end: number }[] => {
    const sortedRanges = [...ranges].sort((a, b) => a.start - b.start);
    const mergedRanges: { start: number; end: number }[] = [];

    for (const range of sortedRanges) {
        const previous = mergedRanges.at(-1);
        if (previous && range.start <= previous.end) {
            previous.end = Math.max(previous.end, range.end);
        } else {
            mergedRanges.push({ ...range });
        }
    }

    return mergedRanges;
};

const matchesPreferredDay = (
    start: Date,
    schedulePreference: SchedulePreference,
): boolean => {
    const dayOfWeek = SCHEDULE_PREFERENCE_DAY_OF_WEEK_VALUES[getJSTDay(start)];

    return schedulePreference.dayWeights.some(
        (day) => day.dayOfWeek === dayOfWeek,
    );
};

const containsWholeTimeRange = (
    timeRange: TimeRange,
    range: SchedulePreferenceHourRange,
): boolean => {
    const slotDurationMinutes =
        (timeRange.end.getTime() - timeRange.start.getTime()) / (60 * 1000);
    const durationMinutes = range.durationHours * 60;
    if (slotDurationMinutes <= 0 || slotDurationMinutes > durationMinutes) {
        return false;
    }

    const startOffsetMinutes = getMinutesSinceJSTHour(
        timeRange.start,
        range.startHour,
    );

    return startOffsetMinutes + slotDurationMinutes <= durationMinutes;
};

const timeRangesOverlap = (a: TimeRange, b: TimeRange): boolean =>
    a.start < b.end && a.end > b.start;

const getJSTHour = (date: Date): number => (date.getUTCHours() + 9) % 24;

const getJSTMinuteOfDay = (date: Date): number =>
    getJSTHour(date) * 60 + date.getUTCMinutes();

const getMinutesSinceJSTHour = (date: Date, startHour: number): number => {
    const startMinuteOfDay = startHour * 60;
    return (getJSTMinuteOfDay(date) - startMinuteOfDay + 24 * 60) % (24 * 60);
};

const getJSTDay = (date: Date): number => {
    const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    return jstDate.getUTCDay();
};
