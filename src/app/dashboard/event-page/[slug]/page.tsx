"use client"

import { Navbar } from "@/components/dashboard/Navbar";
import { CustomEventPage } from "@/features/custom-event-page/CustomEventPage";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
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
    const { eventCreatorId } = useGroupOwnerContext();
    const router = useRouter();

    useEffect(() => {
        if (!loading && userId === null && eventCreatorId === null) {
            router.push('/');
        }
    }, [loading, userId, router, eventCreatorId]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <GridLoader className="opacity-50" color="#fff" size={24} margin={2} />
            </div>
        )
    }

    return (
        <div className="max-w-[1200px] w-full flex justify-self-center justify-center items-center min-h-screen">
            <div className="self-start sticky top-24">
                <Navbar />
            </div>
            {eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 &&
                <CustomEventPage eventId={eventId} />
            }
        </div>
    );
}