import { formatDate } from "./date";

interface DateInterval {
    start: Date;
    end: Date;
}

export function formatFreeSlotsForAI(freeSlots: DateInterval[]): string {
    if (freeSlots.length === 0) {
        return "利用可能な共通の空き時間帯はありませんでした。";
    }

    const formattedStrings = freeSlots.map((slot) => {
        const startDate = formatDate(slot.start, "M月d日(E) HH:mm");
        const endDate = formatDate(slot.end, "HH:mm");
        return `- ${startDate} から ${endDate} まで`;
    });

    return "利用可能な共通の空き時間帯リスト:\n" + formattedStrings.join("\n");
}
