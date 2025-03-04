"use client"

import { EventSearchComponent } from "@/features/events-main-page/EventSearchComponent";
import { EventsSection } from "@/features/events-main-page/EventsSection";
import { useCityContext } from "@/providers/cityContextProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
    const { city } = useCityContext();
    const { userId, loading, userName } = useUserContext();
    const router = useRouter();

    useEffect(() => {

        if (!loading && userId === null) {
            router.push('/');
            return;
        }

        if (!loading && (!userName || userName.trim() === "")) {
            router.push('/dashboard');
            return;
        }
    }, [loading, userId, userName, router]);

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