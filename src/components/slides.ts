interface SlideData {
    id: number;
    title: string;
    description: string;
    image: string;
    alt: string;
    bgClass: string;
    textClass: string;
}

export const slides: SlideData[] = [
    {
        id: 1,
        title: "Lablinkとは？",
        description: "Lablinkは研究室と学生をつなげるプラットフォーム。",
        image: "/screenshots/screenshot1.png",
        alt: "Lablink overview",
        bgClass: "bg-gradient-to-br from-blue-500 to-blue-700",
        textClass: "text-white",
    },
    {
        id: 2,
        title: "スケジュール調整",
        description: "こちらはスライド2の説明文です。",
        image: "/screenshots/screenshot2.png",
        alt: "Schedule coordination feature",
        bgClass: "bg-gradient-to-br from-slate-100 to-slate-200",
        textClass: "text-gray-900",
    },
    {
        id: 3,
        title: "簡単な操作",
        description: "こちらはスライド3の説明文です。",
        image: "/screenshots/screenshot3.png",
        alt: "Easy operation interface",
        bgClass: "bg-gradient-to-br from-slate-100 to-slate-200",
        textClass: "text-gray-900",
    },
    {
        id: 4,
        title: "簡単な操作",
        description: "こちらはスライド3の説明文です。",
        image: "/screenshots/screenshot3.png",
        alt: "Easy operation interface",
        bgClass: "bg-gradient-to-br from-slate-100 to-slate-200",
        textClass: "text-gray-900",
    },
];

export type { SlideData };
