"use client"

import { EventCard } from "./EventCard"
import { CreateEventDialog } from "./modals/CreateEventDialog"

export const EventsSection = () => {
    return (
        <div className="flex flex-col gap-4 w-full">
            <CreateEventDialog />
            <div className="flex flex-col gap-8">
                <EventCard />
            </div>
        </div>
    )
}