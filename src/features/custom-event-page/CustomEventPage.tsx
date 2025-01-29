import { EventNavbar } from "@/components/EventNavbar"
import { EventHero } from "./EventHero"
import { EventInfoSection } from "./EventInfoSection"
import { EventInfoSidebar } from "./EventInfoSidebar"


interface EventPageProps {
    eventId: string
}

export const CustomEventPage = ({
    eventId
}: EventPageProps) => {
    return (
        <>
            <div className="max-w-[1200px] w-full justify-self-center pl-4 min-[900px]:pl-16">
                <div className="flex justify-between gap-8 pb-24">
                    <div className="flex flex-col gap-8 items-center min-h-screen w-full relative top-24">
                        <EventHero eventId={eventId} />
                        <EventInfoSection eventId={eventId} />
                    </div>
                    <div className="w-[30%] max-[900px]:hidden">
                        <EventInfoSidebar eventId={eventId} />  
                    </div>
                </div>
                <div className="sticky bottom-0">
                    <EventNavbar eventId={eventId} />
                </div>
            </div>
        </>
    )
}