"use client"

import { EventCard } from "./EventCard"
import { CreateEventDialog } from "./modals/CreateEventDialog"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const EventsSection = () => {
    const { eventCreatorId } = useGroupOwnerContext()
    const { userId, loading } = useUserContext();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !userId) {
            router.push('/');
        }
    }, [loading, userId, router]);


    return (
        <div className="flex flex-col gap-4">
            <CreateEventDialog />

            {eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 && (
                <EventCard />
            )}
        </div>
    )
}