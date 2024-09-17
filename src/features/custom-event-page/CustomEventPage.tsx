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
            <div className="flex flex-col gap-8 items-center w-full min-h-screen relative top-24">
                <EventHero eventId={eventId} />
                <EventInfoSection eventId={eventId} />
            </div>
        </>
    )
}