"use client"

import { EventCard } from "./EventCard"
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const EventsSection = () => {
    const { userId, loading } = useUserContext();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !userId) {
            router.push('/');
        }
    }, [loading, userId, router]);


    return (
        <div className="flex flex-col gap-4 min-h-[80vh]">
            {userId.length > 0 && (
                <EventCard />
            )}
        </div>
    )
}