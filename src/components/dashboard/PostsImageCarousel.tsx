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
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [count, setCount] = useState(0)

    useEffect(() => {
        if (!api) {
            return
        }

        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap() + 1)

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1)
        })
    }, [api])

    return (
        <Carousel setApi={setApi}
            className="justify-self-center w-full">
            <CarouselContent>
                {Array.from({ length: imageCount }).map((_, index) => (
                    <CarouselItem key={index}>
                        <Card>
                            <CardContent className="flex items-center aspect-video w-full h-full overflow-hidden rounded-md">
                                <Image
                                    className="aspect-video w-full object-fill"
                                    src={imageUrls[index]}
                                    alt={`Image ${index}`}
                                    width={1920}
                                    height={1080}
                                    priority
                                />
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