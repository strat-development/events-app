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

interface ImageCarouselProps {
    imageUrls: string[];
    eventId?: string;
    album: { id: string };
    groupId?: string;
}

export function ImageCarousel({ imageUrls, eventId, groupId, album }: ImageCarouselProps) {
    return (
        <Carousel className="justify-self-center">
            <CarouselContent>
                {imageUrls.map((imageUrl, index) => (
                    <CarouselItem key={index}>

                        {window.location.pathname.includes('dashboard/event-photos') && (
                            <Link href={window.location.pathname.includes('dashboard') ? `/dashboard/event-photos-album/${eventId}?albumId=${album.id}` : `/event-photos-album/${eventId}?albumId=${album.id}`}>
                                <Card>
                                    <CardContent className="flex aspect-square items-center justify-center p-4">
                                        <Image className="rounded-md"
                                            src={imageUrl} alt={`Image ${index}`} width={2000} height={2000} />
                                    </CardContent>
                                </Card>
                            </Link>
                        ) || window.location.pathname.includes('dashboard/group-photos') && (
                            <Link href={window.location.pathname.includes('dashboard') ? `/dashboard/group-photos-album/${groupId}?albumId=${album.id}` : `/group-photos-album/${groupId}?albumId=${album.id}`}>
                                <Card>
                                    <CardContent className="flex aspect-square items-center justify-center p-4">
                                        <Image className="rounded-md"
                                            src={imageUrl} alt={`Image ${index}`} width={2000} height={2000} />
                                    </CardContent>
                                </Card>
                            </Link>
                        )}

                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
        </Carousel >
    )
}
