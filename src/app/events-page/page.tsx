"use client";

import { useCityContext } from "@/providers/cityContextProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { EventData } from "@/types/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format, parseISO } from "date-fns";
import { CalendarIcon, CalendarRange, CalendarX, Plus, Ticket } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import stringSimilarity from "string-similarity";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination";
import GridLoader from "react-spinners/GridLoader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { EventSidebar } from "@/components/EventSidebar";
import { Button } from "@/components/ui/button";
import "@/styles/calendar-icon.css"

export default function EventsPage() {
    const supabase = createClientComponentClient<Database>();
    const [events, setEvents] = useState<EventData[]>([]);
    const [imageUrls, setImageUrls] = useState<{ [eventId: string]: string }>({});
    const [eventInterestFromUrl, setEventInterestFromUrl] = useState<string | null>(null);
    const [eventCityFromUrl, setEventCityFromUrl] = useState<string | null>(null);
    const { city } = useCityContext();
    const { userId, loading } = useUserContext();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
    const [selectedEventImageUrl, setSelectedEventImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && userId === null) {
            router.push('/');
        }
    }, [loading, userId, router]);

    useEffect(() => {
        const searchParam = searchParams.get('search');
        const cityParam = searchParams.get('city');

        setEventCityFromUrl(cityParam);
        setEventInterestFromUrl(searchParam);
    }, []);

    const eventQuery = useQuery(
        ['events', eventInterestFromUrl, eventCityFromUrl, city],
        async () => {
            if (!eventInterestFromUrl && !eventCityFromUrl && !city) return [];

            const cityFilter = eventCityFromUrl || city;

            const { data, error } = await supabase
                .from("events")
                .select("*")
                .ilike('event_address', `%${cityFilter}%`);

            if (error) {
                console.error('Error fetching events:', error);
                throw new Error(error.message);
            }

            const exactMatches = data.filter((event: EventData) => {
                const eventTopics = event.event_topics as { interests: { name: string }[] };
                return eventTopics?.interests.some((interest: { name: string }) =>
                    interest.name.toLowerCase() === eventInterestFromUrl?.toLowerCase()
                );
            });

            const similarityThreshold = 0.05;
            const similarMatches = exactMatches.length > 0 ? exactMatches : data.filter((event: EventData) => {
                const eventTopics = event.event_topics as { interests: { name: string }[] };
                return eventTopics && Array.isArray(eventTopics.interests) && eventTopics.interests.some((interest: { name: string }) => {
                    const similarityScores = eventInterestFromUrl ? [stringSimilarity.compareTwoStrings(
                        interest.name.toLowerCase(), eventInterestFromUrl.toLowerCase()
                    )] : [];
                    return similarityScores.some(score => score >= similarityThreshold);
                });
            });

            return similarMatches;
        },
        {
            onSuccess: (data) => {
                setEvents(data);
            },
            cacheTime: 10 * 60 * 1000,
        }
    );

    const imageQuery = useQuery(
        ['event-pictures', events.map(event => event.id)],
        async () => {
            if (events.length === 0) return [];

            const { data, error } = await supabase
                .from('event-pictures')
                .select('*')
                .in('event_id', events.map(event => event.id));

            if (error) {
                throw error;
            }

            return data || [];
        },
        {
            enabled: events.length > 0,
            cacheTime: 10 * 60 * 1000,
        }
    );

    useEffect(() => {
        if (imageQuery.data) {
            Promise.all(imageQuery.data.map(async (image) => {
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
    }, [imageQuery.data, supabase.storage]);

    const memoizedEvents = useMemo(() => events, [events]);
    const memoizedImageUrls = useMemo(() => imageUrls, [imageUrls]);

    const totalPages = Math.ceil(memoizedEvents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = memoizedEvents.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <GridLoader className="opacity-50" color="#fff" size={24} margin={2} />
            </div>
        )
    }

    return (
        <>
            <div className="max-w-[1200px] w-full justify-self-center pt-24 flex flex-col gap-4">
                <div className="flex flex-wrap max-[800px]:justify-center gap-8">
                    {currentItems.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-4 w-full h-[70vh]">
                            <div className="metallic-icon-container">
                                <div className="metallic-icon-container">
                                    <svg className="metallic-gradient">
                                        <defs>
                                            <linearGradient id="metallic-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#ffffff" stopOpacity=".5" />
                                                <stop offset="25%" stopColor="#a0a0a0" stopOpacity="0.7" />
                                                <stop offset="50%" stopColor="#d3d3d3" stopOpacity="0.8" />
                                                <stop offset="75%" stopColor="#a0a0a0" stopOpacity="0.9" />
                                                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.7" />
                                            </linearGradient>
                                        </defs>
                                    </svg>

                                    <div className="metallic-icon">
                                        <CalendarX />
                                    </div>
                                </div>
                                <div className="gradient-overlay" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <p className="text-center text-xl text-white/60 font-medium">No events found</p>
                                <p className="text-center text-lg text-white/50">It's a great opportunity to create one</p>
                            </div>
                            <Button className="flex gap-4 w-fit text-lg px-4 text-white/70"
                                variant="outline"
                                onClick={() => router.push('/dashboard/events')}>
                                Create Event
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    ) || (

                            currentItems.map((event) => (
                                <div onClick={() => {
                                    setIsSidebarOpen(true);
                                    setSelectedEvent(event);
                                    setSelectedEventImageUrl(memoizedImageUrls[event.id]);
                                }}
                                    key={event.id}
                                    className="flex flex-col cursor-pointer gap-2 w-[280px] h-[440px]  border rounded-xl border-white/10 p-4">
                                    <div className="flex items-center justify-center border rounded-xl border-white/10 w-full aspect-square">
                                        {memoizedImageUrls[event.id] && (
                                            <Image
                                                src={memoizedImageUrls[event.id]}
                                                alt={event.event_title || ""}
                                                width={2000}
                                                height={2000}
                                                objectFit="cover"
                                            />
                                        ) || (
                                                <div className="w-full h-full flex items-center justify-center bg-white/10 rounded-xl">
                                                    <p className="text-center font-medium">No image available 😔</p>
                                                </div>
                                            )}
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <h1 className="text-lg font-bold tracking-wider line-clamp-2">{event.event_title}</h1>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm text-white/70">{format(parseISO(event?.starts_at as string), 'yyyy-MM-dd HH:mm')}</p>
                                            <p className="text-sm text-white/60">{event?.event_address}</p>
                                            <div className="flex gap-2 mt-1 items-center">
                                                <Ticket className="h-4 w-4" />
                                                {event.ticket_price === "FREE" ? (
                                                    <p className="text-sm text-white/60">FREE</p>
                                                ) : (
                                                    <p className="text-sm text-white/60">{event?.ticket_price}$</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                </div>

                {currentItems.length > 0 && (
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
                )}
            </div>

            <SidebarProvider>
                {isSidebarOpen && <EventSidebar imageUrl={selectedEventImageUrl}
                    selectedEvent={selectedEvent}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)} />}
            </SidebarProvider>
        </>
    );
}
