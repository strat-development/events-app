"use state"

import { useUserContext } from "@/providers/UserContextProvider"
import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useQuery } from "react-query"
import { Button } from "../ui/button"
import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider"
import { Globe, Ticket } from "lucide-react"
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation"
import { DeleteEventDialog } from "./modals/events/DeleteEventDialog"
import { CreateEventDialog } from "./modals/events/CreateEventDialog"
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination"
import { EditEventDialog } from "./modals/events/EditEventDialog"

export const EventSection = () => {
    const supabase = createClientComponentClient<Database>()
    const { eventCreatorId, ownerId } = useGroupOwnerContext();
    const { userId } = useUserContext();
    const [attendingEvents, setAttendingEvents] = useState<string>("attending")
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
                .eq('user_id', userId) 

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
                .eq('created_by', eventCreatorId)
                .order('starts_at', { ascending: false });

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

    const eventIds = attendingEvents
        ? fetchedEventsByAttendees.data?.map(event => event.events?.id) || []
        : fetchedEventsByHosts.data?.map(event => event.id) || [];

    const { data: images } = useQuery(
        ['event-pictures', eventIds],
        async () => {
            if (eventIds.length === 0) return [];

            const { data, error } = await supabase
                .from('event-pictures')
                .select('*')
                .in('event_id', eventIds)
                .order('starts_at', { ascending: false });

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
    const currentPastAttendingItems = memoizedEventsByAttendees?.filter(event => new Date(event.events?.starts_at || "") < new Date()) ?? [];

    const totalPages = Math.ceil((attendingEvents ? (memoizedEventsByAttendees?.length ?? 0) : (memoizedEventsByHosts?.length ?? 0)) / itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-4">
                <Button className={attendingEvents === "attending" ? "border-b-[1px] border-white/70 text-white/70 rounded-none hover:bg-transparent" : "text-white/50 hover:bg-transparent"}
                    variant="ghost"
                    onClick={() => {
                        setAttendingEvents("attending");
                        fetchedEventsByAttendees.refetch();
                    }}>
                    Attending
                </Button>
                <Button className={attendingEvents === "hosting" ? "border-b-[1px] border-white/70 text-white/70 rounded-none hover:bg-transparent" : "text-white/50 hover:bg-transparent"}
                    variant="ghost"
                    onClick={() => {
                        setAttendingEvents("hosting");
                        fetchedEventsByHosts.refetch();
                    }}>
                    Hosting
                </Button>
                <Button className={attendingEvents === "past" ? "border-b-[1px] border-white/70 text-white/70 rounded-none hover:bg-transparent" : "text-white/50 hover:bg-transparent"}
                    variant="ghost"
                    onClick={() => {
                        setAttendingEvents("past");
                        fetchedEventsByHosts.refetch();
                    }}>
                    Past
                </Button>
            </div>

            <div className="flex flex-wrap max-[800px]:justify-between gap-8">
                {attendingEvents === "attending" && (
                    <>
                        {attendingEvents && currentAttendingItems.length === 0 && (
                            <div className="flex flex-col justify-self-center items-center w-full gap-8 mt-24">
                                <h2 className="text-white/70 text-center text-2xl font-semibold tracking-wide">You have no upcoming events to attend.</h2>
                                <Button
                                    className="flex flex-col items-center max-w-[280px] w-full p-4 justify-center rounded-xl bg-transparent hover:bg-white/5 transition-all duration-300"
                                    onClick={() => router.push('/home')}
                                    variant="ghost">
                                    <div className="flex flex-col items-center gap-8">
                                        <div className="text-6xl text-white/70">
                                            <Globe size={128}
                                                strokeWidth={1} />
                                        </div>
                                        <p className="text-xl tracking-wide text-white/50 font-medium">Discover events</p>
                                    </div>
                                </Button>
                            </div>
                        )}

                        {currentAttendingItems?.map((event) => (
                            <div key={event.events?.id} className="flex flex-col gap-2 w-[280px] h-[440px]  border rounded-xl border-white/10 p-4">
                                <div className="flex items-center justify-center border rounded-xl border-white/10 w-full aspect-square">
                                    {event.events?.id && memoizedImageUrls[event.events?.id] ? (
                                        <Image
                                            src={memoizedImageUrls[event.events?.id]}
                                            alt={event.events?.event_title || ""}
                                            width={200}
                                            height={200}
                                            className="object-cover rounded-xl w-full max-h-[240px]"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-xl">
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
                                            {event.events?.ticket_price === "FREE" ? (
                                                <p className="text-sm text-white/60 font-bold tracking-wide">FREE</p>
                                            ) : (
                                                <p className="text-sm text-white/60 font-bold tracking-wide">{event.events?.ticket_price}$</p>
                                            )}
                                        </div>
                                    </div>
                                    <Button className="rounded-xl w-fit text-sm text-white/70"
                                        variant={"outline"}
                                        onClick={() => router.push(`/event-page/${event.events?.id}`)}>View event</Button>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            <div className="flex flex-wrap max-[800px]:justify-between gap-8">
                {attendingEvents === "hosting" && (
                    <>
                        <CreateEventDialog ownerId={ownerId} />

                        {currentHostItems?.map((event) => (
                            <div key={event.id} className="flex flex-col gap-2 w-[280px] h-[440px]  border rounded-xl border-white/10 p-4">

                                <div className="flex items-center justify-center border rounded-xl border-white/10 w-full aspect-square">
                                    {event.id && imageUrls[event.id] ? (
                                        <Image
                                            src={imageUrls[event.id]}
                                            alt={event.event_title || ""}
                                            width={200}
                                            height={200}
                                            className="object-cover rounded-xl w-full max-h-[240px]"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/10 rounded-xl">
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
                                            {event?.ticket_price === "FREE" ? (
                                                <p className="text-sm text-white/60 font-bold tracking-wide">FREE</p>
                                            ) : (
                                                <p className="text-sm text-white/60 font-bold tracking-wide">{event?.ticket_price}$</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center gap-4 mt-2">
                                        <div className="flex gap-4">
                                            <Button className="rounded-xl w-fit text-sm text-white/70"
                                                variant={"outline"}
                                                onClick={() => router.push(`/dashboard/event-page/${event.id}`)}>View event</Button>
                                            <EditEventDialog eventId={event.id} />
                                        </div>

                                        <DeleteEventDialog eventId={event.id} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            <div className="flex flex-wrap max-[800px]:justify-between gap-8">
                {attendingEvents === "past" && (
                    <>
                        {currentPastAttendingItems?.map((event) => (
                            <div key={event.events?.id} className="flex flex-col gap-2 w-[280px] h-[440px]  border rounded-xl border-white/10 p-4 opacity-50">

                                <div className="flex items-center justify-center border rounded-xl border-white/10 w-full aspect-square">
                                    {event.events?.id && imageUrls[event.events?.id] ? (
                                        <Image
                                            src={imageUrls[event.events?.id]}
                                            alt={event.events?.event_title || ""}
                                            width={200}
                                            height={200}
                                            className="object-cover rounded-xl w-full max-h-[240px]"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/10 rounded-xl">
                                            <p className="text-center font-medium">No image available 😔</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h1 className="text-lg font-bold tracking-wider line-clamp-2">{event.events?.event_title}</h1>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm text-white/70">{format(parseISO(event.events?.starts_at as string), 'yyyy-MM-dd HH:mm')}</p>
                                        <p className="text-sm text-white/60">{event.events?.event_address}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Ticket className="h-4 w-4" />
                                            {event.events?.ticket_price === "FREE" ? (
                                                <p className="text-sm text-white/60 font-bold tracking-wide">FREE</p>
                                            ) : (
                                                <p className="text-sm text-white/60 font-bold tracking-wide">{event.events?.ticket_price}$</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center gap-4 mt-2">
                                        <div className="flex gap-4">
                                            <Button className="rounded-xl w-fit text-sm text-white/70"
                                                variant={"outline"}
                                                onClick={() => router.push(`/dashboard/event-page/${event.events?.id}`)}>View event</Button>
                                        </div>

                                        <DeleteEventDialog eventId={event.events?.id as string} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {
                (attendingEvents && currentAttendingItems.length > 20) || (!attendingEvents && currentHostItems.length > 20) ? (
                    <Pagination>
                        <PaginationContent className="flex gap-8">
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={currentPage === 1 ? undefined : () => handlePageChange(currentPage - 1)}
                                    aria-disabled={currentPage === 1}
                                />
                            </PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        isActive={page === currentPage}
                                        onClick={() => handlePageChange(page)}
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={currentPage === totalPages ? undefined : () => handlePageChange(currentPage + 1)}
                                    aria-disabled={currentPage === totalPages}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                ) : null
            }
        </div >
    )
}