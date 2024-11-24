"use client"

import { CustomEventPage } from "@/features/custom-event-page/CustomEventPage";
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
    const router = useRouter();

    // if (!userId) {
    //     router.push('/');
    //     return null
    // }

    return (
        <div className="flex justify-center items-center min-h-screen">
            <CustomEventPage eventId={eventId} />
        </div>
    );
}