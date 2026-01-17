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
            <div className="max-w-[1200px] w-full justify-self-center pt-24 px-6 flex flex-col gap-8">

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h1 className="text-3xl font-bold tracking-wider bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                        {eventInterestFromUrl ? `${eventInterestFromUrl} Events` : 'Discover Events'}
                    </h1>
                    <p className="text-white/60 mt-2">
                        {eventCityFromUrl || city ? `in ${eventCityFromUrl || city}` : 'Find events near you'}
                    </p>
                </div>

                {currentItems.length === 0 ? (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 shadow-xl">
                        <div className="flex flex-col items-center justify-center gap-6 w-full min-h-[50vh]">
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
                                <p className="text-center text-2xl text-white/70 font-semibold">No events found</p>
                                <p className="text-center text-lg text-white/50">It's a great opportunity to create one</p>
                            </div>
                            <Button
                                className="flex gap-2 w-fit px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                                onClick={() => router.push('/dashboard/events')}
                            >
                                <Plus className="h-5 w-5" />
                                Create Event
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {currentItems.map((event) => (
                                <div
                                    onClick={() => {
                                        setIsSidebarOpen(true);
                                        setSelectedEvent(event);
                                        setSelectedEventImageUrl(memoizedImageUrls[event.id]);
                                    }}
                                    key={event.id}
                                    className="group bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer"
                                >
                                    <div className="relative aspect-square overflow-hidden">
                                        {memoizedImageUrls[event.id] ? (
                                            <Image
                                                src={memoizedImageUrls[event.id]}
                                                alt={event.event_title || ""}
                                                width={400}
                                                height={400}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                <div className="text-center flex flex-col items-center gap-2">
                                                    <CalendarIcon className="w-12 h-12 text-white/30" />
                                                    <p className="text-sm text-white/50 font-medium">No image</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-blue-500 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg">
                                            <p className="text-xs font-bold text-white">
                                                {format(parseISO(event?.starts_at as string), 'MMM dd')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 flex flex-col gap-3">
                                        <h2 className="text-lg font-bold tracking-wide text-white/90 line-clamp-2 group-hover:text-white transition-colors">
                                            {event.event_title}
                                        </h2>

                                        <div className="flex flex-col gap-2 text-sm">
                                            <div className="flex items-center gap-2 text-white/60">
                                                <CalendarRange className="h-4 w-4 flex-shrink-0" />
                                                <span className="truncate">
                                                    {format(parseISO(event?.starts_at as string), 'HH:mm')}
                                                </span>
                                            </div>

                                            <p className="text-white/60 truncate text-xs">
                                                {event?.event_address}
                                            </p>

                                            <div className="flex items-center gap-2 pt-1">
                                                <div className="bg-white/5 rounded-lg px-3 py-1.5 flex items-center gap-2">
                                                    <Ticket className="h-4 w-4 text-white/70" />
                                                    {event.ticket_price === "FREE" ? (
                                                        <span className="text-sm font-semibold text-green-400">FREE</span>
                                                    ) : (
                                                        <span className="text-sm font-semibold text-white/90">${event?.ticket_price}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
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
                    </>
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
