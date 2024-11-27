"use client"

import { CreateEventImagesAlbumDialog } from "@/components/dashboard/modals/CreateEventImagesAlbumDialog";
import { Navbar } from "@/components/dashboard/Navbar";
import { EventGallery } from "@/features/custom-event-page/EventGallery";
import { EventHero } from "@/features/custom-event-page/EventHero";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";

export default function EventPhotosPage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const eventId = params.slug;
    const { userId } = useUserContext();
    const { eventCreatorId } = useGroupOwnerContext();
    const router = useRouter();

    // if (!eventCreatorId || !userId) {
    //     router.push('/');
    //     return null
    // }

    return (
        <>
            {eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 &&
                <div className="flex justify-self-center justify-between items-start min-h-screen max-w-[1200px] w-full">
                    <Navbar />
                    <div className="flex flex-col gap-8 max-w-[1200px] w-full min-h-screen relative top-24">
                        <EventHero eventId={eventId} />
                        {window.location.pathname.includes("/dashboard") && (
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
