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
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface AlbumsImageCarouselProps {
    imageUrls: string[];
    eventId?: string;
    album: { id: string };
    groupId?: string;
    imageCount: number;
}

export function AlbumsImageCarousel({ imageUrls, eventId, groupId, album, imageCount }: AlbumsImageCarouselProps) {
    const pathname = usePathname();
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

    const isDashboard = pathname.includes('dashboard');
    const isEventPhotos = pathname.includes('event-page');
    const isGroupPhotos = pathname.includes('group-page');

    const getHref = () => {
        if (isEventPhotos) {
            return isDashboard
                ? `/dashboard/event-photos-album/${eventId}?albumId=${album.id}`
                : `/event-photos-album/${eventId}?albumId=${album.id}`;
        }
        if (isGroupPhotos) {
            return isDashboard
                ? `/dashboard/group-photos-album/${groupId}?albumId=${album.id}`
                : `/group-photos-album/${groupId}?albumId=${album.id}`;
        }
        return '#';
    };

    const handleImageError = (index: number) => {
        setFailedImageIndexes((prev) => new Set(prev).add(index));
    };

    return (
        <Carousel setApi={setApi} className="justify-self-center">
            <CarouselContent>
                {imageUrls.map((imageUrl, index) => (
                    <CarouselItem key={index}>
                        <Link href={getHref()} scroll={false}>
                            <Card>
                                <CardContent className="flex aspect-square items-center justify-center p-4">
                                    {failedImageIndexes.has(index) ? (
                                        <div className="flex items-center justify-center max-w-[1200px] w-full h-full bg-white/5 text-white/70">
                                            <span>Image failed to load</span>
                                        </div>
                                    ) : (
                                        <Image
                                            className="rounded-xl"
                                            src={imageUrl}
                                            alt={`Image ${index}`}
                                            width={2000}
                                            height={2000}
                                            onError={() => handleImageError(index)}
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
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