import { formatToJST } from "@/lib/date";
import { ja } from "date-fns/locale";

interface TimeInterval {
    start: string;
    end: string;
}

export function formatFreeSlotsForAI(freeSlots: TimeInterval[]): string {
    if (freeSlots.length === 0) {
        return "利用可能な共通の空き時間帯はありませんでした。";
    }

    const formattedStrings = freeSlots.map((slot) => {
        const startDate = formatToJST(new Date(slot.start), "M月d日(E) HH:mm", {
            locale: ja,
        });
        const endDate = formatToJST(new Date(slot.end), "HH:mm", { locale: ja });
        return `- ${startDate} から ${endDate} まで`;
    });

    return "利用可能な共通の空き時間帯リスト:\n" + formattedStrings.join("\n");
}
