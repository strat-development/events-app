"use client"

import { EventSearchComponent } from "@/features/events-main-page/EventSearchComponent";
import { EventsSection } from "@/features/events-main-page/EventsSection";
import { UserGroupsSection } from "@/features/events-main-page/UserGroupsSection";
import { useCityContext } from "@/providers/cityContextProvider";

export default function Home() {
    const { city } = useCityContext();

    return (
        <div className="flex flex-col items-start mt-24 gap-24 self-center">
            <div className="flex flex-col justify-start items-start gap-16 w-full max-w-[1200px]">
                <EventSearchComponent city={city} />
                <div className="flex flex-col gap-16">
                    <EventsSection />
                    <UserGroupsSection />
                </div>
            </div>
        </div>
    );
}