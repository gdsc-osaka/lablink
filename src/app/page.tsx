"use client";

import LandingHero from "@/components/LandingHero";
import LandingSlider from "@/components/LandingSlider";

export default function Home() {
    return (
        <main className="min-h-screen bg-slate-50">
            {/* ヒーローセクション */}
            <LandingHero />

            {/* スライダーセクション */}
            <LandingSlider />
        </main>
    );
}
