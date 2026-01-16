"use client"

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
import { ImageOff } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface AlbumsImageCarouselProps {
    imageUrls: string[];
    eventId?: string;
    album: { id: string };
    groupId?: string;
    imageCount: number;
    onImageClick?: (imageUrls: string[], index: number) => void;
}

export function AlbumsImageCarousel({ imageUrls, eventId, groupId, album, imageCount, onImageClick }: AlbumsImageCarouselProps) {
    const pathname = usePathname();
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);
    const [failedImageIndexes, setFailedImageIndexes] = useState<Set<number>>(new Set());
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        function initializeCarouselApi() {
            if (!api) return;

            setCount(api.scrollSnapList().length);
            setCurrent(api.selectedScrollSnap() + 1);

            api.on("select", () => {
                setCurrent(api.selectedScrollSnap() + 1);
            });
        }

        initializeCarouselApi();
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
        <div 
            className="relative group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Carousel setApi={setApi} className="w-full max-w-[320px]">
                <CarouselContent>
                    {imageUrls.map((imageUrl, index) => {
                        const cardContent = (
                            <Card className="border-0 bg-transparent overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:border-white/40 hover:shadow-2xl hover:shadow-white/10">
                                        {failedImageIndexes.has(index) ? (
                                            <div className="flex flex-col items-center justify-center w-full h-full gap-3">
                                                <ImageOff className="w-12 h-12 text-white/30" strokeWidth={1.5} />
                                                <span className="text-sm text-white/50">Image unavailable</span>
                                            </div>
                                        ) : (
                                            <Image
                                                className="object-cover transition-transform duration-500 hover:scale-105"
                                                src={imageUrl}
                                                alt={`Album image ${index + 1}`}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 320px"
                                                onError={() => handleImageError(index)}
                                            />
                                        )}
                                        
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                </CardContent>
                            </Card>
                        );

                        return (
                            <CarouselItem key={index}>
                                {onImageClick ? (
                                    <div 
                                        onClick={() => onImageClick(imageUrls, index)}
                                        className="cursor-pointer"
                                    >
                                        {cardContent}
                                    </div>
                                ) : (
                                    <Link href={getHref()} scroll={false}>
                                        {cardContent}
                                    </Link>
                                )}
                            </CarouselItem>
                        );
                    })}
                </CarouselContent>
                
                <div className={twMerge(
                    "absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 transition-all duration-300",
                    isHovered ? "opacity-100" : "opacity-70"
                )}>
                    <span className="text-xs font-medium text-white">
                        {current} / {count}
                    </span>
                </div>
                
                {imageCount > 1 && (
                    <>
                        <CarouselPrevious className={twMerge(
                            "left-2 h-8 w-8 border-white/20 bg-black/40 backdrop-blur-md hover:bg-black/60 hover:border-white/40 transition-all duration-200",
                            isHovered ? "opacity-100" : "opacity-0"
                        )} />
                        <CarouselNext className={twMerge(
                            "right-2 h-8 w-8 border-white/20 bg-black/40 backdrop-blur-md hover:bg-black/60 hover:border-white/40 transition-all duration-200",
                            isHovered ? "opacity-100" : "opacity-0"
                        )} />
                    </>
                )}
            </Carousel>
        </div>
    );
}