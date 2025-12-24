"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { CarouselApi } from "@/components/ui/carousel";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

interface SlideData {
    id: number;
    title: string;
    description: string;
    image: string;
    alt: string;
    bgClass: string;
    textClass: string;
}

const slides: SlideData[] = [
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
];

export default function LandingSlider() {
    const [api, setApi] = useState<CarouselApi>();
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(true);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    useEffect(() => {
        if (!api) {
            return;
        }

        const updateScrollButtons = () => {
            setCanScrollPrev(api.canScrollPrev());
            setCanScrollNext(api.canScrollNext());
        };

        updateScrollButtons();
        api.on("select", updateScrollButtons);

        return () => {
            api.off("select", updateScrollButtons);
        };
    }, [api]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setLightboxSrc(null);
            }
        };
        if (lightboxSrc) {
            window.addEventListener("keydown", onKey);
        }
        return () => window.removeEventListener("keydown", onKey);
    }, [lightboxSrc]);

    return (
        <section className="py-12 md:py-16">
            <div className="container mx-auto max-w-[1200px] px-6 md:px-8">
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    setApi={setApi}
                    className="w-full"
                >
                    <CarouselContent className="-ml-4">
                        {slides.map((slide) => (
                            <CarouselItem
                                key={slide.id}
                                className="pl-4 md:basis-1/2 lg:basis-1/3"
                            >
                                <div
                                    className={`rounded-xl overflow-hidden shadow-sm ${slide.bgClass} aspect-[16/9] md:aspect-[4/3] relative group cursor-pointer transition-transform hover:scale-[1.02]`}
                                    onClick={() => setLightboxSrc(slide.image)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                        ) {
                                            setLightboxSrc(slide.image);
                                        }
                                    }}
                                >
                                    {/* 画像 */}
                                    <div className="absolute inset-0 flex items-center justify-center p-6">
                                        <Image
                                            src={slide.image}
                                            alt={slide.alt}
                                            width={600}
                                            height={400}
                                            className="object-contain max-h-[60%]"
                                        />
                                    </div>

                                    {/* オーバーレイ */}
                                    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                                        <h3
                                            className={`text-xl md:text-2xl font-bold ${slide.textClass} mb-2`}
                                        >
                                            {slide.title}
                                        </h3>
                                        <p
                                            className={`text-sm md:text-base ${slide.textClass} opacity-90`}
                                        >
                                            {slide.description}
                                        </p>
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    {canScrollPrev && <CarouselPrevious />}
                    {canScrollNext && <CarouselNext />}
                </Carousel>

                {/* Lightbox */}
                {lightboxSrc && (
                    <div
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                        onClick={() => setLightboxSrc(null)}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Image preview"
                    >
                        <div
                            className="relative max-w-[90vw] max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={lightboxSrc}
                                alt="Preview"
                                width={1200}
                                height={800}
                                className="object-contain max-w-[90vw] max-h-[90vh] rounded-lg"
                            />
                            <button
                                className="absolute -top-4 -right-4 bg-white text-black rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={() => setLightboxSrc(null)}
                                aria-label="Close preview"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
