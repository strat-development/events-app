import * as React from "react"

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "../ui/card"
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AlbumsImageCarouselProps {
    imageUrls: string[];
    eventId?: string;
    album: { id: string };
    groupId?: string;
}

export function AlbumsImageCarousel({ imageUrls, eventId, groupId, album }: AlbumsImageCarouselProps) {
    const pathname = usePathname();

    const isDashboard = pathname.includes('dashboard');
    const isEventPhotos = pathname.includes('event-photos');
    const isGroupPhotos = pathname.includes('group-photos');

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

    return (
        <Carousel className="justify-self-center">
            <CarouselContent>
                {imageUrls.map((imageUrl, index) => (
                    <CarouselItem key={index}>
                        <Link href={getHref()}>
                            <Card>
                                <CardContent className="flex aspect-square items-center justify-center p-4">
                                    <Image className="rounded-md"
                                        src={imageUrl} alt={`Image ${index}`} width={2000} height={2000} />
                                </CardContent>
                            </Card>
                        </Link>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
        </Carousel>
    )
}