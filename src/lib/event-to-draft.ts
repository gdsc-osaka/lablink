import { Timestamp } from "firebase/firestore";
import { Event, EventDraft, EventTimeOfDay } from "@/domain/event";

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
