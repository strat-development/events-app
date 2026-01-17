import { EventNavbar } from "@/components/EventNavbar"
import { EventHero } from "./EventHero"
import { EventInfoSidebar } from "./EventInfoSidebar"
import { EventInfoSection } from "./EventInfoSection"
import { EventGallerySection } from "./EventGallerySection"
import { useViewContext } from "@/providers/pageViewProvider"


interface EventPageProps {
    eventId: string
}

export const CustomEventPage = ({
    eventId
}: EventPageProps) => {
    const { view } = useViewContext();

    return (
        <>
            <div className="max-w-[1200px] w-full justify-self-center items-center px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-24 mt-24">
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        <EventHero eventId={eventId} />
                        {view == "about" && (
                            <EventInfoSection eventId={eventId} />
                        ) || (
                                <EventGallerySection eventId={eventId} />
                            )}
                    </div>
                    
                    <div className="lg:col-span-4">
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