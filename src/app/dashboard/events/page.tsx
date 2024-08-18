import { EventsSection } from "@/components/dashboard/EventsSection";
import { Navbar } from "@/components/dashboard/Navbar"

export default function EventPage() {
    return (
        <div className="flex justify-between items-center h-[100vh]">
            <Navbar />
            <EventsSection />
        </div>
    );
}