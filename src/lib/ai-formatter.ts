import { formatToJST } from "@/lib/date";
import { ja } from "date-fns/locale";

interface DateInterval {
    start: Date;
    end: Date;
}

export function formatFreeSlotsForAI(freeSlots: DateInterval[]): string {
    if (freeSlots.length === 0) {
        return "利用可能な共通の空き時間帯はありませんでした。";
    }

    const formattedStrings = freeSlots.map((slot) => {
        const startDate = formatToJST(slot.start, "M月d日(E) HH:mm", {
      locale: ja,
    });
        const endDate = formatToJST(slot.end, "HH:mm", { locale: ja });
        return `- ${startDate} から ${endDate} まで`;
    });

    return "利用可能な共通の空き時間帯リスト:\n" + formattedStrings.join("\n");
}
