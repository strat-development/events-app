"use client"

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
import { getEventsByAttendee } from "@/fetchers/events/getEventsByAttendee"
import { getEventsByHost } from "@/fetchers/events/getEventsByHost"
import { getEventPictures } from "@/fetchers/events/getEventPictures"

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
        () => getEventsByAttendee(userId!),
        {
            enabled: !!userId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    const fetchedEventsByHosts = useQuery(
        ['eventsByHosts', eventCreatorId],
        () => getEventsByHost(eventCreatorId!),
        {
            enabled: !!userId && !!eventCreatorId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    const eventIds = attendingEvents
        ? fetchedEventsByAttendees.data?.map(event => event.events?.id) || []
        : fetchedEventsByHosts.data?.map(event => event.id) || [];

    const { data: images } = useQuery(
        ['event-pictures', eventIds],
        () => getEventPictures(eventIds as string[]),
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

    const memoizedImageUrls = useMemo(() => imageUrls, [imageUrls]);
    const currentAttendingItems = memoizedEventsByAttendees?.filter(event => new Date(event.events?.starts_at || "") > new Date()) ?? [];
    const currentHostItems = memoizedEventsByHosts?.filter(event => new Date(event.starts_at || "") > new Date()) ?? [];
    const currentPastAttendingItems = memoizedEventsByAttendees?.filter(event => new Date(event.events?.starts_at || "") < new Date()) ?? [];

    const totalPages = Math.ceil((attendingEvents ? (memoizedEventsByAttendees?.length ?? 0) : (memoizedEventsByHosts?.length ?? 0)) / itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                <h1 className="text-3xl font-bold tracking-wider bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-4">
                    Your Events
                </h1>
                <div className="flex gap-2">
                    <Button 
                        className={attendingEvents === "attending" 
                            ? "bg-white/20 text-white" 
                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90"
                        }
                        variant="ghost"
                        onClick={() => {
                            setAttendingEvents("attending");
                            fetchedEventsByAttendees.refetch();
                        }}
                    >
                        Attending
                    </Button>
                    <Button 
                        className={attendingEvents === "hosting" 
                            ? "bg-white/20 text-white" 
                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90"
                        }
                        variant="ghost"
                        onClick={() => {
                            setAttendingEvents("hosting");
                            fetchedEventsByHosts.refetch();
                        }}
                    >
                        Hosting
                    </Button>
                    <Button 
                        className={attendingEvents === "past" 
                            ? "bg-white/20 text-white" 
                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90"
                        }
                        variant="ghost"
                        onClick={() => {
                            setAttendingEvents("past");
                            fetchedEventsByHosts.refetch();
                        }}
                    >
                        Past
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap gap-6">
                {attendingEvents === "attending" && (
                    <>
                        {currentAttendingItems.length === 0 && (
                            <div className="col-span-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 shadow-xl">
                                <div className="flex flex-col items-center gap-6">
                                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 rounded-full">
                                        <Globe size={64} strokeWidth={1.5} className="text-white" />
                                    </div>
                                    <div className="text-center">
                                        <h2 className="text-2xl font-bold text-white/90 mb-2">No Upcoming Events</h2>
                                        <p className="text-white/60">You have no events to attend</p>
                                    </div>
                                    <Button
                                        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                                        onClick={() => router.push('/home')}
                                    >
                                        Discover Events
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentAttendingItems?.map((event) => (
                            <div key={event.events?.id} className="group bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl w-[280px] h-[360px] flex flex-col">
                                <div className="relative h-40 overflow-hidden">
                                    {event.events?.id && memoizedImageUrls[event.events?.id] ? (
                                        <Image
                                            src={memoizedImageUrls[event.events?.id]}
                                            alt={event.events?.event_title || ""}
                                            width={400}
                                            height={400}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                                            <p className="text-center text-sm text-white/50 font-medium">No image</p>
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl px-3 py-1.5 shadow-lg">
                                        <p className="text-xs font-bold text-white">
                                            {format(parseISO(event.events?.starts_at as string), 'MMM dd')}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4 flex flex-col gap-2">
                                    <h2 className="text-base font-bold tracking-wide text-white/90 line-clamp-2 group-hover:text-white transition-colors">
                                        {event.events?.event_title}
                                    </h2>
                                    <div className="flex flex-col gap-1.5 text-sm">
                                        <p className="text-white/60 text-xs truncate">{event.events?.event_address}</p>
                                        <div className="bg-white/5 rounded-lg px-3 py-1.5 flex items-center gap-2 w-fit">
                                            <Ticket className="h-4 w-4 text-white/70" />
                                            {event.events?.ticket_price === "FREE" ? (
                                                <span className="text-sm font-semibold text-green-400">FREE</span>
                                            ) : (
                                                <span className="text-sm font-semibold text-white/90">${event.events?.ticket_price}</span>
                                            )}
                                        </div>
                                    </div>
                                    <Button 
                                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
                                        variant="outline"
                                        onClick={() => router.push(`/event-page/${event.events?.id}`)}
                                    >
                                        View Event
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            <div className="flex flex-wrap gap-6">
                {attendingEvents === "hosting" && (
                    <>
                        <CreateEventDialog ownerId={ownerId} />

                        {currentHostItems?.map((event) => (
                            <div key={event.id} className="group bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl w-[280px] h-[360px] flex flex-col">
                                <div className="relative h-40 overflow-hidden">
                                    {event.id && imageUrls[event.id] ? (
                                        <Image
                                            src={imageUrls[event.id]}
                                            alt={event.event_title || ""}
                                            width={400}
                                            height={400}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                                            <p className="text-center text-sm text-white/50 font-medium">No image</p>
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl px-3 py-1.5 shadow-lg">
                                        <p className="text-xs font-bold text-white">
                                            {format(parseISO(event.starts_at as string), 'MMM dd')}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4 flex flex-col gap-3">
                                    <h2 className="text-lg font-bold tracking-wide text-white/90 line-clamp-2 group-hover:text-white transition-colors">
                                        {event.event_title}
                                    </h2>
                                    <div className="flex flex-col gap-2 text-sm">
                                        <p className="text-white/60 text-xs truncate">{event.event_address}</p>
                                        <div className="bg-white/5 rounded-lg px-3 py-1.5 flex items-center gap-2 w-fit">
                                            <Ticket className="h-4 w-4 text-white/70" />
                                            {event?.ticket_price === "FREE" ? (
                                                <span className="text-sm font-semibold text-green-400">FREE</span>
                                            ) : (
                                                <span className="text-sm font-semibold text-white/90">${event?.ticket_price}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
                                            variant="outline"
                                            onClick={() => router.push(`/dashboard/event-page/${event.id}`)}
                                        >
                                            View
                                        </Button>
                                        <EditEventDialog eventId={event.id} />
                                        <DeleteEventDialog eventId={event.id} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            <div className="flex flex-wrap gap-6">
                {attendingEvents === "past" && (
                    <>
                        {currentPastAttendingItems?.map((event) => (
                            <div key={event.events?.id} className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden opacity-60 hover:opacity-80 transition-all duration-300 w-[280px] h-[360px] flex flex-col">
                                <div className="relative h-40 overflow-hidden">
                                    {event.events?.id && imageUrls[event.events?.id] ? (
                                        <Image
                                            src={imageUrls[event.events?.id]}
                                            alt={event.events?.event_title || ""}
                                            width={400}
                                            height={400}
                                            className="w-full h-full object-cover grayscale"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                                            <p className="text-center text-sm text-white/50 font-medium">No image</p>
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 bg-white/10 rounded-xl px-3 py-1.5">
                                        <p className="text-xs font-bold text-white/70">
                                            {format(parseISO(event.events?.starts_at as string), 'MMM dd')}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4 flex flex-col gap-3">
                                    <h2 className="text-lg font-bold tracking-wide text-white/70 line-clamp-2">
                                        {event.events?.event_title}
                                    </h2>
                                    <div className="flex flex-col gap-2 text-sm">
                                        <p className="text-white/50 text-xs truncate">{event.events?.event_address}</p>
                                        <div className="bg-white/5 rounded-lg px-3 py-1.5 flex items-center gap-2 w-fit">
                                            <Ticket className="h-4 w-4 text-white/50" />
                                            {event.events?.ticket_price === "FREE" ? (
                                                <span className="text-sm font-semibold text-white/60">FREE</span>
                                            ) : (
                                                <span className="text-sm font-semibold text-white/60">${event.events?.ticket_price}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300"
                                            variant="outline"
                                            onClick={() => router.push(`/dashboard/event-page/${event.events?.id}`)}
                                        >
                                            View
                                        </Button>
                                        <DeleteEventDialog eventId={event.events?.id as string} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {((attendingEvents && currentAttendingItems.length > 20) || (!attendingEvents && currentHostItems.length > 20)) && totalPages > 1 && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-xl">
                    <Pagination>
                        <PaginationContent className="flex gap-2">
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={currentPage === 1 ? undefined : () => handlePageChange(currentPage - 1)}
                                    aria-disabled={currentPage === 1}
                                    className="hover:bg-white/10 transition-colors"
                                />
                            </PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        isActive={page === currentPage}
                                        onClick={() => handlePageChange(page)}
                                        className={page === currentPage 
                                            ? "bg-white/10 text-white hover:bg-white/15" 
                                            : "hover:bg-white/10 transition-colors"
                                        }
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={currentPage === totalPages ? undefined : () => handlePageChange(currentPage + 1)}
                                    aria-disabled={currentPage === totalPages}
                                    className="hover:bg-white/10 transition-colors"
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    )
}