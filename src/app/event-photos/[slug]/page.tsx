"use client"

import { CreateEventImagesAlbumDialog } from "@/components/dashboard/modals/events/CreateEventImagesAlbumDialog";
import { EventGallery } from "@/features/custom-event-page/EventGallery";
import { EventHero } from "@/features/custom-event-page/EventHero";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";
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
    const router = useRouter();

    useEffect(() => {
        if (!loading && userId === null) {
            router.push('/');
        }
    }, [loading, userId, router]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <GridLoader className="opacity-50" color="#fff" size={24} margin={2} />
            </div>
        )
    }

    return (
        <>
            <div className="flex justify-self-center justify-between items-start min-h-screen max-w-[1200px] w-full">
                <div className="flex flex-col gap-8 max-w-[1200px] w-full min-h-screen relative top-24">
                    <EventHero eventId={eventId} />
                    <EventGallery eventId={eventId} />
                </div>
            </div>
        </>
    )
}