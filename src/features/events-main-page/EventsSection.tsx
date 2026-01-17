"use client"

import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { EventData } from "@/types/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import stringSimilarity from "string-similarity";
import { format, startOfToday, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import Image from "next/image";
import { UserGroupsSection } from "./UserGroupsSection";
import { CalendarDialog } from "@/components/CalendarDialog";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination"
import { GroupPostsSection } from "../group-page/GroupPostsSection";
import { SidebarProvider } from "@/components/ui/sidebar";
import { EventSidebar } from "@/components/EventSidebar";


export const EventsSection = () => {
    const supabase = createClientComponentClient<Database>();
    const { userInterests, loading, userId } = useUserContext();
    const [events, setEvents] = useState<{ [date: string]: EventData[] }>({});
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [imageUrls, setImageUrls] = useState<{ [eventId: string]: string }>({});
    const eventIds = Object.values(events).flat().map((event) => event.id);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const [view, setView] = useState<"events" | "groups">("events");
    const [groupId, setGroupId] = useState<string[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
    const [selectedEventImageUrl, setSelectedEventImageUrl] = useState<string | null>(null);

    const getGroupId = useQuery(
        'group-id',
        async () => {
            const { data, error } = await supabase
                .from('group-members')
                .select('group_id')
                .eq('member_id', userId);

            if (error) {
                console.error('Error fetching group id:', error);
                throw new Error(error.message);
            }

            setGroupId(data.map((group) => group.group_id as string));

            return data;
        },
        {
            cacheTime: 10 * 60 * 1000,
        })

    const handleDateChange = (date: Date) => {
        setSelectedDate(date);
    };

    useQuery(
        ['events', userInterests, selectedDate],
        async () => {
            if (!userInterests || userInterests.length === 0 && !loading) return [];

            const today = startOfToday().toISOString();

            const { data, error } = await supabase
                .from("events")
                .select("*")
                .gte('starts_at', selectedDate?.toISOString() || today)
                .order("starts_at", { ascending: false })

            if (error) {
                console.error('Error fetching events:', error);
                throw new Error(error.message);
            }

            if (data) {
                const exactMatches = data.filter((event: EventData) => {
                    const eventTopics = event.event_topics as { interests: { name: string }[] };
                    return eventTopics?.interests.some((interest: { name: string }) =>
                        userInterests.includes(interest.name)
                    );
                });

                const similarityThreshold = 0.5;
                const similarMatches = exactMatches.length > 0 ? exactMatches : data.filter((event: EventData) => {
                    const eventTopics = event.event_topics as { interests: { name: string }[] };
                    return eventTopics && Array.isArray(eventTopics.interests) && eventTopics.interests.some((interest: { name: string }) => {
                        const similarityScores = userInterests.map(userInterest =>
                            stringSimilarity.compareTwoStrings(
                                interest.name.toLowerCase(),
                                userInterest.toLowerCase()
                            )
                        );
                        return Math.max(...similarityScores) >= similarityThreshold;
                    });
                });

                const filteredEvents = selectedDate
                    ? similarMatches.filter((event: EventData) =>
                        parseISO(event.starts_at as string) >= selectedDate
                    )
                    : similarMatches;

                const groupedEvents = filteredEvents.reduce((acc: { [date: string]: EventData[] }, event: EventData) => {
                    const eventDate = format(parseISO(event.starts_at as string), 'yyyy-MM-dd');
                    if (!acc[eventDate]) {
                        acc[eventDate] = [];
                    }
                    acc[eventDate].push(event);
                    return acc;
                }, {});

                setEvents(groupedEvents);
            }
        },
        {
            enabled: !!userInterests && userInterests.length > 0,
            cacheTime: 10 * 60 * 1000,
        }
    );

    const { data: images, isLoading } = useQuery(
        ['event-pictures', eventIds],
        async () => {
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
            enabled: !!eventIds,
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

                    if (JSON.stringify(imageUrls) !== JSON.stringify(urlMapping)) {
                        setImageUrls(urlMapping);
                    }
                })
                .catch(console.error);
        }
    }, [images]);

    const memoizedEvents = useMemo(() => events, [events]);
    const memoizedImageUrls = useMemo(() => imageUrls, [imageUrls]);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = Object.values(memoizedEvents).flat().slice(startIndex, endIndex);
    const totalItems = Object.values(memoizedEvents).flat().length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <>
            <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
                <div className="flex flex-col gap-6 lg:w-80 lg:sticky lg:top-24 w-full">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-xl hidden lg:block">
                        <Calendar 
                            className="border-none w-full"
                            onDayClick={handleDateChange}
                        />
                    </div>
                    <div className="fixed z-[99999] bottom-[5%] right-[5%] lg:hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-full shadow-2xl">
                            <CalendarDialog onDayClick={handleDateChange} />
                        </div>
                    </div>
                    <UserGroupsSection />
                </div>

                <div className="flex flex-col gap-6 flex-1 w-full">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-2 shadow-xl flex gap-2 w-fit">
                        <Button 
                            className={view === "events"
                                ? "bg-white/10 text-white hover:bg-white/15 transition-all duration-300"
                                : "text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300"
                            }
                            variant="ghost"
                            onClick={() => setView("events")}
                        >
                            Upcoming Events
                        </Button>
                        <Button 
                            className={view === "groups"
                                ? "bg-white/10 text-white hover:bg-white/15 transition-all duration-300"
                                : "text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300"
                            }
                            variant="ghost"
                            onClick={() => setView("groups")}
                        >
                            Groups Feed
                        </Button>
                    </div>
                    {view === "events" ? (
                        currentItems.length > 0 ? (
                            currentItems.map((event: EventData) => (
                                <div 
                                    key={event.id}
                                    onClick={() => {
                                        setIsSidebarOpen(true);
                                        setSelectedEvent(event);
                                        setSelectedEventImageUrl(memoizedImageUrls[event.id]);
                                    }}
                                    className="group bg-white/5 backdrop-blur-sm hover:bg-white/10 border border-white/10 hover:border-white/20 cursor-pointer rounded-2xl transition-all duration-300 hover:scale-[1.01] hover:shadow-xl overflow-hidden"
                                >
                                    <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 px-6 py-3 border-b border-white/10">
                                        <p className="text-sm font-semibold text-white/90">
                                            {format(parseISO(event.starts_at as string), 'EEEE, MMMM dd, yyyy')}
                                        </p>
                                    </div>

                                    <div className="flex gap-4 p-6">
                                        <div className="flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 overflow-hidden rounded-xl ring-2 ring-white/10 group-hover:ring-white/30 transition-all">
                                            {memoizedImageUrls[event.id] ? (
                                                <Image
                                                    src={memoizedImageUrls[event.id]}
                                                    alt=""
                                                    width={200}
                                                    height={200}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                    <p className="text-center text-xs text-white/50 px-2">No image</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                                            <h2 className="text-xl sm:text-2xl font-bold tracking-wider line-clamp-2 text-white/90 group-hover:text-white transition-colors">
                                                {event.event_title}
                                            </h2>
                                            <div className="flex flex-col gap-2 text-sm">
                                                <p className="text-white/70">
                                                    {format(parseISO(event.starts_at as string), 'HH:mm')} - {format(parseISO(event.ends_at as string), 'HH:mm')}
                                                </p>
                                                <p className="text-white/60 line-clamp-1">{event.event_address}</p>
                                                <div className="flex items-center gap-2 mt-1 bg-white/5 w-fit px-3 py-1 rounded-lg">
                                                    <Ticket size={16} className="text-white/70" />
                                                    {event?.ticket_price === "FREE" ? (
                                                        <p className="text-sm text-green-400 font-bold">FREE</p>
                                                    ) : (
                                                        <p className="text-sm text-white/70 font-medium">${event?.ticket_price}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 shadow-xl">
                                <p className="text-center text-white/50">No upcoming events found</p>
                            </div>
                        )
                    ) : (
                        <GroupPostsSection groupId={groupId as any} />
                    )}

                    {totalItems > 20 && (
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
            </div>

            <SidebarProvider>
                {isSidebarOpen && <EventSidebar imageUrl={selectedEventImageUrl}
                    selectedEvent={selectedEvent}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)} />}
            </SidebarProvider>
        </>
    );
};
