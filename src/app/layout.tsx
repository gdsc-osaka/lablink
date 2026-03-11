import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../provider/AuthProvider";
import { googleSans, notoSansJP } from "@/lib/font";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
    title: "lablink",
    description: "スケジュール管理を半自動化",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            style={{ height: "100%" }}
            className={`${googleSans.variable} ${notoSansJP.variable} antialiased`}
        >
            <body style={{ height: "100%" }}>
                <AuthProvider>{children}</AuthProvider>
                <Toaster />
            </body>
        </html>
    );
}
