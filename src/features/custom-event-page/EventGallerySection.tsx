"use client"

import { CreateEventImagesAlbumDialog } from "@/components/dashboard/modals/events/CreateEventImagesAlbumDialog";
import { Navbar } from "@/components/dashboard/Navbar";
import { EventGallery } from "@/features/custom-event-page/EventGallery";
import { EventHero } from "@/features/custom-event-page/EventHero";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import GridLoader from "react-spinners/GridLoader";

interface EventGallerySectionProps {
    eventId: string;
}

export const EventGallerySection = ({ eventId }: EventGallerySectionProps) => {
    const { userId, loading } = useUserContext();
    const { eventCreatorId } = useGroupOwnerContext();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && userId === null && eventCreatorId === null) {
            router.push('/');
        }
    }, [loading, userId, router, eventCreatorId]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <GridLoader className="opacity-50" color="#fff" size={24} margin={2} />
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-col justify-self-center justify-between items-end gap-8 max-w-[1200px] w-full">
                {pathname.includes("/dashboard") && (
                    <div className="jusify-self-end">
                        <CreateEventImagesAlbumDialog eventId={eventId} />
                    </div>
                )}
                <EventGallery eventId={eventId} />
            </div>
        </>
    )
}
