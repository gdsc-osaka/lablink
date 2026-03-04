import { Timestamp } from "firebase/firestore";
import { Event, EventDraft, EventTimeOfDay, NewEvent } from "@/domain/event";

/**
 * EventからEventDraftへの変換（編集画面での初期値設定時）
 */
export function convertEventToDraft(event: Event): EventDraft {
    return {
        title: event.title,
        duration: calculateDuration(event.begin_at, event.end_at),
        timeOfDayCandidate: determineTimeOfDay(event.begin_at),
        description: event.description,
    };
}

/**
 * 開始時刻と終了時刻から所要時間を計算
 */
function calculateDuration(beginAt: Timestamp, endAt: Timestamp): string {
    const beginDate = beginAt.toDate();
    const endDate = endAt.toDate();
    const diffMs = endDate.getTime() - beginDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
        return `${diffMinutes}分`;
    } else {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        if (minutes === 0) {
            return `${hours}時間`;
        } else {
            return `${hours}時間${minutes}分`;
        }
    }
}

/**
 * 開始時刻から時間帯を判定
 */
function determineTimeOfDay(beginAt: Timestamp): EventTimeOfDay[] {
    const date = beginAt.toDate();
    const hour = date.getHours();

    if (hour >= 8 && hour < 12) {
        return ["morning"];
    } else if (hour >= 12 && hour < 15) {
        return ["noon"];
    } else if (hour >= 15 && hour < 18) {
        return ["evening"];
    } else if (hour >= 18 && hour < 22) {
        return ["night"];
    } else {
        // 複数の時間帯にまたがる場合や判定できない場合
        return [];
    }
}

/**
 * EventDraftからNewEventへの変換（イベント作成時）
 * ダミーのタイムスタンプを生成して返す
 */
export function convertDraftToEvent(draft: EventDraft): NewEvent {
    // 時間帯の中間時刻を取得
    const startHour = getTimeOfDayStartHour(
        draft.timeOfDayCandidate[0] || "morning",
    );

    // 明日の日付を基準にする（過去の日付を避けるため）
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(startHour, 0, 0, 0);

    // 所要時間をパース
    const durationMinutes = parseDuration(draft.duration);

    // 終了時刻を計算
    const endDate = new Date(tomorrow);
    endDate.setMinutes(endDate.getMinutes() + durationMinutes);

    return {
        title: draft.title,
        description: draft.description,
        begin_at: Timestamp.fromDate(tomorrow),
        end_at: Timestamp.fromDate(endDate),
    };
}

/**
 * 時間帯から開始時刻（時）を取得
 */
function getTimeOfDayStartHour(timeOfDay: EventTimeOfDay): number {
    switch (timeOfDay) {
        case "morning":
            return 10; // 8:00-12:00の中間
        case "noon":
            return 13; // 12:00-15:00の中間
        case "evening":
            return 16; // 15:00-18:00の中間（16:30の代わりに16時）
        case "night":
            return 20; // 18:00-22:00の中間
        default:
            return 10; // デフォルトは朝
    }
}

/**
 * 所要時間の文字列をパースして分数を返す
 * 例: "30分" → 30, "2時間" → 120, "1時間30分" → 90
 */
function parseDuration(duration: string): number {
    const hourMatch = duration.match(/(\d+)\s*時間/);
    const minuteMatch = duration.match(/(\d+)\s*分/);

    const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
    const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;

    const totalMinutes = hours * 60 + minutes;

    // パースに失敗した場合のデフォルト値（1時間）
    return totalMinutes > 0 ? totalMinutes : 60;
}
