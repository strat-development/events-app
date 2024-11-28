"use client"

import { CustomEventPage } from "@/features/custom-event-page/CustomEventPage";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EventPage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const eventId = params.slug;

    const { userId, loading } = useUserContext();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !userId) {
            router.push('/');
        }
    }, [loading, userId, router]);

    return (
        <div className="flex justify-center items-center min-h-screen">
            <CustomEventPage eventId={eventId} />
        </div>
    );
}