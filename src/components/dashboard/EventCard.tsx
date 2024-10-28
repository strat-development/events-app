"use state"

import { useUserContext } from "@/providers/UserContextProvider"
import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { useQuery } from "react-query"
import { Button } from "../ui/button"
import { useEffect, useMemo, useState } from "react"
import { DeleteEventDialog } from "./modals/DeleteEventDialog"
import { EditEventDialog } from "./modals/EditEventDialog"
import Image from "next/image"

export const EventCard = () => {
    const supabase = createClientComponentClient<Database>()
    const { userId } = useUserContext()
    const [attendingVisits, setAttendingVisits] = useState(true)
    const [imageUrls, setImageUrls] = useState<{ [eventId: string]: string }>({});

    const fetchedEventsByAttendees = useQuery(
        ['eventsByAttendees', userId],
        async () => {
            const { data, error } = await supabase
                .from("event-attendees-linker")
                .select(`
                    events (
                        *
                    )
                `)
                .eq('attendee_id', userId);

            if (error) {
                console.error("Error fetching events:", error.message);
                throw new Error(error.message);
            }

            return data;
        },
        {
            enabled: !!userId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    const fetchedEventsByHosts = useQuery(
        ['eventsByHosts', userId],
        async () => {
            const { data, error } = await supabase
                .from("events")
                .select(`*`)
                .eq('created_by', userId);

            if (error) {
                console.error("Error fetching events:", error.message);
                throw new Error(error.message);
            }

            return data;
        },
        {
            enabled: !!userId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    const eventIds = attendingVisits
        ? fetchedEventsByAttendees.data?.map(event => event.events?.id) || []
        : fetchedEventsByHosts.data?.map(event => event.id) || [];

    const { data: images } = useQuery(
        ['event-pictures', eventIds],
        async () => {
            if (eventIds.length === 0) return [];

            const { data, error } = await supabase
                .from('event-pictures')
                .select('*')
                .in('event_id', eventIds);

            if (error) {
                throw error;
            }

            return data || [];
        },
        {
            enabled: eventIds.length > 0,
            cacheTime: 10 * 60 * 1000,
        }
    );

    useEffect(() => {
        if (images) {
            Promise.all(images.map(async (image) => {
                const { data: publicURL } = await supabase.storage
                    .from('event-pictures')
                    .getPublicUrl(image.hero_picture_url || "");

                return { eventId: image.event_id, publicUrl: publicURL.publicUrl };
            }))
                .then((publicUrls) => {
                    const urlMapping: { [eventId: string]: string } = {};
                    publicUrls.forEach(({ eventId, publicUrl }) => {
                        urlMapping[eventId] = publicUrl;
                    });
                    setImageUrls(urlMapping);
                })
                .catch(console.error);
        }
    }, [images]);

    const memoizedEventsByAttendees = useMemo(() => fetchedEventsByAttendees.data, [fetchedEventsByAttendees.data]);
    const memoizedEventsByHosts = useMemo(() => fetchedEventsByHosts.data, [fetchedEventsByHosts.data]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex">
                <Button variant="link"
                    onClick={() => {
                        setAttendingVisits(true);
                        fetchedEventsByAttendees.refetch();
                    }}>
                    Attending
                </Button>
                <Button variant="link"
                    onClick={() => {
                        setAttendingVisits(false);
                        fetchedEventsByHosts.refetch();
                    }}>
                    Hosting
                </Button>
            </div>
            <h1>Events</h1>
            {attendingVisits && (
                memoizedEventsByAttendees?.map((event) => (
                    <div key={event.events?.id} className="flex flex-col items-center mb-4">
                        {event.events?.id && imageUrls[event.events.id] && (
                            <Image
                                src={imageUrls[event.events.id]}
                                alt={event.events.event_title || ""}
                                width={200}
                                height={200}
                            />
                        )}
                        <Link href={`/dashboard/event-page/${event.events?.id}`}>
                            <p>{event.events?.event_title}</p>
                        </Link>
                    </div>
                ))
            )}
            {!attendingVisits && (
                memoizedEventsByHosts?.map((event) => (
                    <div key={event.id} className="flex flex-col items-center mb-4">
                        {imageUrls[event.id] && (
                            <Image
                                src={imageUrls[event.id]}
                                alt={event.event_title || ""}
                                width={200}
                                height={200}
                            />
                        )}
                        <Link href={`/dashboard/event-page/${event.id}`}>
                            <p>{event.event_title}</p>
                        </Link>
                        <div className="flex gap-4">
                            <EditEventDialog eventId={event.id} />
                            <DeleteEventDialog eventId={event.id} />
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};