"use client";

import { useEffect, useState } from "react";
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
                        <div className="flex items-center justify-center h-80 bg-gray-400 rounded-lg shadow-lg">
                            <p className="text-white text-2xl font-semibold text-center px-4">
                                Lablinkについて知ろう
                            </p>
                        </div>
                    </CarouselItem>
                    <CarouselItem className="pl-4 md:basis-1/3">
                        <div className="flex items-center justify-center h-80 bg-gray-300 rounded-lg shadow-lg">
                            <p className="text-gray-700 text-2xl font-semibold text-center px-4">
                                スライド 2
                            </p>
                        </div>
                    </CarouselItem>
                    <CarouselItem className="pl-4 md:basis-1/3">
                        <div className="flex items-center justify-center h-80 bg-gray-300 rounded-lg shadow-lg">
                            <p className="text-gray-700 text-2xl font-semibold text-center px-4">
                                スライド 3
                            </p>
                        </div>
                    </CarouselItem>
                    <CarouselItem className="pl-4 md:basis-1/3">
                        <div className="flex items-center justify-center h-80 bg-gray-300 rounded-lg shadow-lg">
                            <p className="text-gray-700 text-2xl font-semibold text-center px-4">
                                スライド 4
                            </p>
                        </div>
                    </CarouselItem>
                    <CarouselItem className="pl-4 md:basis-1/3">
                        <div className="flex items-center justify-center h-80 bg-gray-300 rounded-lg shadow-lg">
                            <p className="text-gray-700 text-2xl font-semibold text-center px-4">
                                スライド 5
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
