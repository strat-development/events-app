"use client"

import { EventsSection } from "@/components/dashboard/EventsSection";
import { Navbar } from "@/components/dashboard/Navbar"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";

export default function EventPage() {
    const { userId } = useUserContext();
    const { eventCreatorId } = useGroupOwnerContext()
    const router = useRouter();

    if (!eventCreatorId || !userId) {
        router.push('/');
        return null
    }

    return (
        <>
            {eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 && (
                <div className="flex items-center h-[100vh]">
                    <Navbar />
                    <div>
                        <EventsSection />
                    </div>
                </div>
            )}
        </>
    );
}