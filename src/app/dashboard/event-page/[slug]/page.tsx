import { Navbar } from "@/components/dashboard/Navbar";
import { CustomEventPage } from "@/features/custom-event-page/CustomEventPage";


export default function EventPage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const eventId = params.slug;

    return (
        <div className="flex justify-between items-center h-[100vh]">
            <Navbar />
            <CustomEventPage eventId={eventId} />
        </div>
    );
}