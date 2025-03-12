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
            <div className="max-w-[1200px] w-full justify-self-center items-center">
                <div className="flex justify-center gap-8 pb-24">
                    <div className="flex flex-col gap-8 items-center w-full relative top-24">
                        <EventHero eventId={eventId} />
                        {view == "about" && (
                            <EventInfoSection eventId={eventId} />
                        ) || (
                                <EventGallerySection eventId={eventId} />
                            )}
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