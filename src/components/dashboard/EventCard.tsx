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
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider"
import { Pagination } from "@mui/material"

export const EventCard = () => {
    const supabase = createClientComponentClient<Database>()
    const { eventCreatorId } = useGroupOwnerContext();
    const { userId } = useUserContext();
    const [attendingVisits, setAttendingVisits] = useState(true)
    const [imageUrls, setImageUrls] = useState<{ [eventId: string]: string }>({});
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;


    const fetchedEventsByAttendees = useQuery(
        ['eventsByAttendees', userId],
        async () => {
            const { data, error } = await supabase
                .from("event-attendees")
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
                .eq('created_by', eventCreatorId);

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

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const currentAttendingItems = memoizedEventsByAttendees?.slice(startIndex, endIndex) ?? [];
    const currentHostItems = memoizedEventsByHosts?.slice(startIndex, endIndex) ?? [];

    const pageCount = Math.ceil((attendingVisits ? (memoizedEventsByAttendees?.length ?? 0) : (memoizedEventsByHosts?.length ?? 0)) / itemsPerPage);

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
    };

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
            <div className="flex gap-4 items-baseline">
                {attendingVisits && (
                    currentAttendingItems?.map((event) => (
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
            </div>

            <div className="flex gap-4 items-baseline">
                {!attendingVisits && (
                    currentHostItems?.map((event) => (
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
                            {window.location.pathname.includes("/dashboard") && eventCreatorId === userId && (
                                <div className="flex gap-4">
                                    <EditEventDialog eventId={event.id} />
                                    <DeleteEventDialog eventId={event.id} />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
            <Pagination
                className="self-center"
                count={pageCount}
                page={currentPage}
                onChange={handlePageChange}
                variant="outlined"
                color="secondary"
            />
        </div>
    );
};