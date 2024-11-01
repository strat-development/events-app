"use client"

import { CreateEventImagesAlbumDialog } from "@/components/dashboard/modals/CreateEventImagesAlbumDialog";
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
    const router = useRouter();

    if (!userId) {
        router.push('/');
        return null
    }

    return (
        <>
            <div className="flex justify-between items-center h-[100vh]">
                <div className="flex flex-col gap-8 items-center w-full min-h-screen relative top-24">
                    <EventHero eventId={eventId} />
                    {window.location.pathname.includes("/dashboard") && (
                        <div>
                            <CreateEventImagesAlbumDialog eventId={eventId} />
                        </div>
                    )}
                    <div className="grid grid-cols-3 gap-8">
                        <EventGallery eventId={eventId} />
                    </div>
                </div>
            </div>
        </>
    )
}