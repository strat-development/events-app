import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "../ui/card";
import Image from "next/image";
import { useEffect, useState } from "react";

interface PostsImageCarouselProps {
    imageUrls: string[];
    imageCount: number;
}

export function PostsImageCarousel({ imageUrls, imageCount }: PostsImageCarouselProps) {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);
    const [failedImageIndexes, setFailedImageIndexes] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (!api) {
            return;
        }

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });
    }, [api]);

    const handleImageError = (index: number) => {
        setFailedImageIndexes((prev) => new Set(prev).add(index));
    };

    return (
        <Carousel setApi={setApi} className="justify-self-center w-full">
            <CarouselContent>
                {Array.from({ length: imageCount }).map((_, index) => (
                    <CarouselItem key={index}>
                        <Card>
                            <CardContent className="flex items-center aspect-video max-w-[1200px] w-full h-full overflow-hidden rounded-xl">
                                {failedImageIndexes.has(index) ? (
                                    <div className="flex items-center justify-center max-w-[1200px] w-full h-full bg-white/5 text-white/70">
                                        <span>Image failed to load</span>
                                    </div>
                                ) : (
                                    <Image
                                        className="aspect-video w-full object-fill"
                                        src={imageUrls[index]}
                                        alt={`Image ${index}`}
                                        width={1920}
                                        height={1080}
                                        priority
                                        onError={() => handleImageError(index)}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <div className="py-2 text-white/50 text-center text-sm">
                {current}/{count}
            </div>
            {imageCount > 1 && (
                <>
                    <CarouselPrevious className="ml-2" />
                    <CarouselNext className="mr-2" />
                </>
            )}
        </Carousel>
    );
}