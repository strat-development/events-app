"use client"

import { Navbar } from "@/components/Navbar";
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

    if (!userId) {
        router.push('/');
        return null
    }

    return (
        <div className="flex justify-between items-center h-[100vh]">
            <>
                <Navbar />
                <CustomEventPage eventId={eventId} />
            </>
        </div>
    );
}