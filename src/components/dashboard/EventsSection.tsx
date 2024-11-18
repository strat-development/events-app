"use client"

import { EventCard } from "./EventCard"
import { CreateEventDialog } from "./modals/CreateEventDialog"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";

export const EventsSection = () => {
    const { userId } = useUserContext();
    const { eventCreatorId } = useGroupOwnerContext()
    const router = useRouter();

    if (!userId) {
        router.push('/');
        return null
    }


    return (
        <div className="flex flex-col gap-4">
            <CreateEventDialog />

            {eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 && (
                <EventCard />
            )}
        </div>
    )
}