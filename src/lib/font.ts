import { Noto_Sans_JP } from "next/font/google";
import localFont from "next/font/local";

export const googleSans = localFont({
    src: [
        {
            path: "../../public/fonts/GoogleSans-Regular.woff2",
            weight: "400",
            style: "normal",
        },
        {
            path: "../../public/fonts/GoogleSans-Italic.woff2",
            weight: "400",
            style: "italic",
        },
        {
            path: "../../public/fonts/GoogleSans-Medium.woff2",
            weight: "500",
            style: "normal",
        },
        {
            path: "../../public/fonts/GoogleSans-MediumItalic.woff2",
            weight: "500",
            style: "italic",
        },
        {
            path: "../../public/fonts/GoogleSans-Bold.woff2",
            weight: "700",
            style: "normal",
        },
        {
            path: "../../public/fonts/GoogleSans-BoldItalic.woff2",
            weight: "700",
            style: "italic",
        },
    ],
    variable: "--font-google-sans",
});

export const notoSansJP = Noto_Sans_JP({
    variable: "--font-noto-sans-jp",
    subsets: ["latin"],
});
