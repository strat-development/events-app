"use client"

import { CustomEventPage } from "@/features/custom-event-page/CustomEventPage";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import GridLoader from "react-spinners/GridLoader";

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
        if (!loading && userId === null) {
            router.push('/');
        }
    }, [loading, userId, router]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <GridLoader className="opacity-50" color="#fff" size={24} margin={2} />
            </div>
        )
    }

    return (
        <div className="flex justify-center items-center min-h-screen">
            <CustomEventPage eventId={eventId} />
        </div>
    );
}