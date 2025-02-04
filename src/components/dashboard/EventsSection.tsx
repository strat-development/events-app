"use client"

import { EventCard } from "./EventCard"
import { CreateEventDialog } from "./modals/events/CreateEventDialog"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const EventsSection = () => {
    const { eventCreatorId, ownerId } = useGroupOwnerContext()
    const { userId, loading } = useUserContext();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !userId) {
            router.push('/');
        }
    }, [loading, userId, router]);


    return (
        <div className="flex flex-col gap-4 min-h-[80vh]">
            <CreateEventDialog ownerId={ownerId} />

            {eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 && (
                <EventCard />
            )}
        </div>
    )
}