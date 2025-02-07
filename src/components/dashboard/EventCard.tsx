"use state"

import { useUserContext } from "@/providers/UserContextProvider"
import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useQuery } from "react-query"
import { Button } from "../ui/button"
import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider"
import { Pagination } from "@mui/material"
import { Ticket } from "lucide-react"
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation"
import { DeleteEventDialog } from "./modals/events/DeleteEventDialog"

export const EventCard = () => {
    const supabase = createClientComponentClient<Database>()
    const { eventCreatorId } = useGroupOwnerContext();
    const { userId } = useUserContext();
    const [attendingVisits, setAttendingVisits] = useState(true)
    const [imageUrls, setImageUrls] = useState<{ [eventId: string]: string }>({});
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const router = useRouter();

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
    const memoizedImageUrls = useMemo(() => imageUrls, [imageUrls]);
    const currentAttendingItems = memoizedEventsByAttendees?.slice(startIndex, endIndex) ?? [];
    const currentHostItems = memoizedEventsByHosts?.slice(startIndex, endIndex) ?? [];

    const pageCount = Math.ceil((attendingVisits ? (memoizedEventsByAttendees?.length ?? 0) : (memoizedEventsByHosts?.length ?? 0)) / itemsPerPage);

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-4">
                <Button className={attendingVisits === true ? "border-b-[1px] border-white/70 text-white/70 rounded-none hover:bg-transparent" : "text-white/50 hover:bg-transparent"}
                    variant="ghost"
                    onClick={() => {
                        setAttendingVisits(true);
                        fetchedEventsByAttendees.refetch();
                    }}>
                    Attending
                </Button>
                <Button className={attendingVisits === false ? "border-b-[1px] border-white/70 text-white/70 rounded-none hover:bg-transparent" : "text-white/50 hover:bg-transparent"}
                    variant="ghost"
                    onClick={() => {
                        setAttendingVisits(false);
                        fetchedEventsByHosts.refetch();
                    }}>
                    Hosting
                </Button>
            </div>


            {attendingVisits && currentAttendingItems.length === 0 && (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-white/70 text-center">You have no upcoming events to attend.</p>
                </div>
            )}
            {!attendingVisits && currentHostItems.length === 0 && (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-white/70 text-center">You have no upcoming events to host.</p>
                </div>
            )}

            <div className="flex flex-wrap max-[800px]:justify-center gap-8">
                {attendingVisits && (
                    currentAttendingItems?.map((event) => (
                        <div key={event.events?.id} className="flex flex-col gap-2 w-[280px] h-[440px]  border rounded-md border-white/10 p-4">
                            <div className="flex items-center justify-center border rounded-md border-white/10 w-full aspect-square">
                                {event.events?.id && memoizedImageUrls[event.events?.id] ? (
                                    <Image
                                        src={memoizedImageUrls[event.events?.id]}
                                        alt={event.events?.event_title || ""}
                                        width={200}
                                        height={200}
                                        className="object-cover rounded-md w-full max-h-[240px]"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-md">
                                        <p className="text-center font-medium">No image available 😔</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                <h1 className="text-lg font-bold tracking-wider line-clamp-2">{event.events?.event_title}</h1>
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-white/70">{format(parseISO(event.events?.starts_at as string), 'yyyy-MM-dd HH:mm')}</p>
                                    <p className="text-sm text-white/60">{event.events?.event_address}</p>
                                    <div className="flex gap-2 mt-1 items-center">
                                        <Ticket className="h-4 w-4" />
                                        {event.events?.ticket_price === 0 ? (
                                            <p className="text-sm text-white/60">FREE</p>
                                        ) : (
                                            <p className="text-sm text-white/60">{event.events?.ticket_price !== null ? `From $${event.events?.ticket_price}` : "FREE"}</p>
                                        )}
                                    </div>
                                </div>
                                <Button className="rounded-md mt-2 w-fit text-sm"
                                    onClick={() => router.push(`/event-page/${event.events?.id}`)}>View event</Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="flex flex-wrap max-[800px]:justify-center gap-8">
                {!attendingVisits && (
                    currentHostItems?.map((event) => (
                        <div key={event.id} className="flex flex-col gap-2 w-[280px] h-[440px]  border rounded-md border-white/10 p-4">
                            <div className="flex items-center justify-center border rounded-md border-white/10 w-full aspect-square">
                                {event.id && imageUrls[event.id] ? (
                                    <Image
                                        src={imageUrls[event.id]}
                                        alt={event.event_title || ""}
                                        width={200}
                                        height={200}
                                        className="object-cover rounded-md w-full max-h-[240px]"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/10 rounded-md">
                                        <p className="text-center font-medium">No image available 😔</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                <h1 className="text-lg font-bold tracking-wider line-clamp-2">{event.event_title}</h1>
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-white/70">{format(parseISO(event.starts_at as string), 'yyyy-MM-dd HH:mm')}</p>
                                    <p className="text-sm text-white/60">{event.event_address}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Ticket className="h-4 w-4" />
                                        {event?.ticket_price === 0 ? (
                                            <p className="text-sm text-white/60">FREE</p>
                                        ) : (
                                            <p className="text-sm text-white/60">{event?.ticket_price !== null ? `From $${event.ticket_price}` : "FREE"}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-4 items-baseline">
                                    <Button className="rounded-md mt-2 w-fit text-sm"
                                        onClick={() => router.push(`/dashboard/event-page/${event.id}`)}>View event</Button>
                                    <DeleteEventDialog eventId={event.id} />
                                </div>
                            </div>
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
                sx={{
                    '& .MuiPaginationItem-root': {
                        color: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0)',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                    '& .Mui-selected': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1) !important',
                        color: 'white',
                    },
                }}
            />
        </div>
    )
}