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

export default function EventPhotosPage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const eventId = params.slug;
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
            {eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 &&
                <div className="flex justify-self-center justify-between items-start min-h-screen max-w-[1200px] w-full">
                    <Navbar />
                    <div className="flex flex-col gap-8 max-w-[1200px] w-full min-h-screen relative top-24 pl-4 min-[900px]:pl-16">
                        <EventHero eventId={eventId} />
                        {pathname.includes("/dashboard") && (
                            <div className="jusify-self-end">
                                <CreateEventImagesAlbumDialog eventId={eventId} />
                            </div>
                        )}
                        <EventGallery eventId={eventId} />
                    </div>
                </div>
            }
        </>
    )
}
