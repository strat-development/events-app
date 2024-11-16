"use client"

import { EventSearchComponent } from "@/features/events-main-page/EventSearchComponent";
import { EventsSection } from "@/features/events-main-page/EventsSection";
import { useCityContext } from "@/providers/cityContextProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";

export default function Home() {
    const { city } = useCityContext();
    const { userId, userName } = useUserContext();
    const router = useRouter();

    if (!userId) {
        router.push('/');
        return null
    }

    if (!userName) {
        router.push('/dashboard');
        return null
    }

    return (
        <div className="flex flex-col items-center mt-24 gap-16">
            <div className="flex flex-col justify-center items-center gap-16 w-full max-w-[1200px]">
                <EventSearchComponent city={city} />
                <div className="flex flex-col gap-16 max-w-[1200px] w-full">
                    <EventsSection />
                </div>
            </div>
        </div>
    );
}