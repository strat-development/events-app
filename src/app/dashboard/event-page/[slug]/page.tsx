"use client"

import { Navbar } from "@/components/dashboard/Navbar";
import { CustomEventPage } from "@/features/custom-event-page/CustomEventPage";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
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
    const { eventCreatorId } = useGroupOwnerContext();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !userId && !eventCreatorId) {
            router.push('/');
        }
    }, [loading, userId, router, eventCreatorId]);

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