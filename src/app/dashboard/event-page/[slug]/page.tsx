"use client"

import { Navbar } from "@/components/dashboard/Navbar";
import { CustomEventPage } from "@/features/custom-event-page/CustomEventPage";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";


export default function EventPage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const eventId = params.slug;
    const { userId } = useUserContext();
    const { eventCreatorId } = useGroupOwnerContext();
    const router = useRouter();

    if (!eventCreatorId || !userId) {
        router.push('/');
        return null
    }

    return (
        <div className="flex justify-between items-center h-[100vh]">
            {eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 &&
                <>
                    <Navbar />
                    <CustomEventPage eventId={eventId} />
                </>
            }
        </div>
    );
}