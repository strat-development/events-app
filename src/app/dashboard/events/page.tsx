"use client"

import { EventsSection } from "@/components/dashboard/EventsSection";
import { Navbar } from "@/components/dashboard/Navbar"
import { useUserContext } from "@/providers/UserContextProvider";

export default function EventPage() {
    const { userId } = useUserContext();

    return (
        <>
            <div className="flex justify-between items-start pt-24 max-w-[1200px] w-full justify-self-center">
                <Navbar />
                {userId.length > 0 && (
                    <div className="justify-self-center overflow-x-hidden w-full pl-4 min-[900px]:pl-16">
                        <EventsSection />
                    </div>
                )}
            </div>
        </>
    );
}