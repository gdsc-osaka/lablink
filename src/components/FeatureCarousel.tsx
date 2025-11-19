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
                        <div className="carousel-slide-primary">
                            <p className="carousel-slide-text-light">
                                Lablinkについて知ろう
                            </p>
                        </div>
                    </CarouselItem>
                    <CarouselItem className="pl-4 md:basis-1/3">
                        <div className="carousel-slide-secondary">
                            <p className="carousel-slide-text-dark">
                                スライド 2
                            </p>
                        </div>
                    </CarouselItem>
                    <CarouselItem className="pl-4 md:basis-1/3">
                        <div className="carousel-slide-secondary">
                            <p className="carousel-slide-text-dark">
                                スライド 3
                            </p>
                        </div>
                    </CarouselItem>
                    <CarouselItem className="pl-4 md:basis-1/3">
                        <div className="carousel-slide-secondary">
                            <p className="carousel-slide-text-dark">
                                スライド 4
                            </p>
                        </div>
                    </CarouselItem>
                    <CarouselItem className="pl-4 md:basis-1/3">
                        <div className="carousel-slide-secondary">
                            <p className="carousel-slide-text-dark">
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
