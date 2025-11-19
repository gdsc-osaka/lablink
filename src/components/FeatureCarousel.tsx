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

export default function FeatureCarousel() {
    const [api, setApi] = useState<CarouselApi>();
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(true);

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

    return (
        <div className="w-full mt-8 mb-8">
            <Carousel
                opts={{
                    align: "center",
                    loop: false,
                    startIndex: 0,
                }}
                setApi={setApi}
                className="w-full"
            >
                <CarouselContent className="-ml-4">
                    <CarouselItem className="pl-4 md:basis-1/3">
                        <div className="carousel-slide-primary flex flex-col">
                            <h3 className="carousel-slide-text-light font-bold mt-4">
                                Lablinkとは？
                            </h3>
                            <div className="px-[10px]">
                                <Image
                                    src="/screenshots/screenshot1.png"
                                    alt="Lablink overview"
                                    width={400}
                                    height={160}
                                    className="mx-auto my-4 max-h-40 object-contain"
                                />
                            </div>
                            <p className="text-lg text-white flex-1 flex items-center justify-center px-4">
                                Lablinkは研究室と学生をつなげるプラットフォーム。
                            </p>
                        </div>
                    </CarouselItem>
                    <CarouselItem className="pl-4 md:basis-1/3">
                        <div className="carousel-slide-secondary flex flex-col">
                            <h3 className="carousel-slide-text-dark font-bold mt-4">
                                スライド 2
                            </h3>
                            <div className="px-[10px]">
                                <Image
                                    src="/screenshots/screenshot2.png"
                                    alt="Slide 2"
                                    width={400}
                                    height={160}
                                    className="mx-auto my-4 max-h-40 object-contain"
                                />
                            </div>
                            <p className="text-lg text-gray-700 flex-1 flex items-center justify-center px-4">
                                こちらはスライド2の説明文です。
                            </p>
                        </div>
                    </CarouselItem>
                    <CarouselItem className="pl-4 md:basis-1/3">
                        <div className="carousel-slide-secondary flex flex-col">
                            <h3 className="carousel-slide-text-dark font-bold mt-4">
                                スライド 3
                            </h3>
                            <div className="px-[10px]">
                                <Image
                                    src="/screenshots/screenshot3.png"
                                    alt="Slide 3"
                                    width={400}
                                    height={160}
                                    className="mx-auto my-4 max-h-40 object-contain"
                                />
                            </div>
                            <p className="text-lg text-gray-700 flex-1 flex items-center justify-center px-4">
                                こちらはスライド3の説明文です。
                            </p>
                        </div>
                    </CarouselItem>
                    <CarouselItem className="pl-4 md:basis-1/3">
                        <div className="carousel-slide-secondary flex flex-col">
                            <h3 className="carousel-slide-text-dark font-bold mt-4">
                                スライド 4
                            </h3>
                            <div className="px-[10px]">
                                <Image
                                    src="/screenshots/screenshot4.png"
                                    alt="Slide 4"
                                    width={400}
                                    height={160}
                                    className="mx-auto my-4 max-h-40 object-contain"
                                />
                            </div>
                            <p className="text-lg text-gray-700 flex-1 flex items-center justify-center px-4">
                                こちらはスライド4の説明文です。
                            </p>
                        </div>
                    </CarouselItem>
                    <CarouselItem className="pl-4 md:basis-1/3">
                        <div className="carousel-slide-secondary flex flex-col">
                            <h3 className="carousel-slide-text-dark font-bold mt-4">
                                スライド 5
                            </h3>
                            <div className="px-[10px]">
                                <Image
                                    src="/screenshots/screenshot5.png"
                                    alt="Slide 5"
                                    width={400}
                                    height={160}
                                    className="mx-auto my-4 max-h-40 object-contain"
                                />
                            </div>
                            <p className="text-lg text-gray-700 flex-1 flex items-center justify-center px-4">
                                こちらはスライド5の説明文です。
                            </p>
                        </div>
                    </CarouselItem>
                </CarouselContent>
                {canScrollPrev && <CarouselPrevious />}
                {canScrollNext && <CarouselNext />}
            </Carousel>
        </div>
    );
}
