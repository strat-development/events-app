import { EventNavbar } from "@/components/EventNavbar"
import { EventsSection } from "../group-page/EventsSection"
import { EventHero } from "./EventHero"
import { EventInfoSection } from "./EventInfoSection"


interface EventPageProps {
    eventId: string
}

export const CustomEventPage = ({
    eventId
}: EventPageProps) => {
    return (
        <>
            <div className="w-full min-h-screen">
                <div className="flex flex-col gap-8 items-center w-full relative top-24">
                    <EventHero eventId={eventId} />
                    <EventInfoSection eventId={eventId} />
                </div>
                <EventNavbar eventId={eventId} />
            </div>
        </>
    )
}