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
                .gte('starts_at', selectedDate?.toISOString() || today);

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
            <div className="flex flex-col gap-16 items-center w-full min-[1200px]:flex-row min-[1200px]:items-start">
                <div className="flex flex-col gap-8 min-[1200px]:w-fit min-[1200px]:sticky min-[1200px]:top-24">
                    <Calendar className="z-[2] hidden border border-white/10 w-full min-[1200px]:flex min-[1200px]:items-center min-[1200px]:justify-center rounded-xl"
                        onDayClick={handleDateChange}
                    />
                    <div className="fixed z-[99999] bg-white p-2 rounded-full bottom-[10%] right-[5%] min-[1200px]:hidden">
                        <CalendarDialog onDayClick={handleDateChange} />
                    </div>
                    <UserGroupsSection />
                </div>
                <div className="flex flex-col gap-8 w-full">
                    <div className="flex gap-4">
                        <Button className="text-white/70"
                            onClick={() => setView("events")}
                            variant="link">
                            Upcoming Events
                        </Button>
                        <Button className="text-white/70"
                            onClick={() => setView("groups")}
                            variant="link">
                            Groups Feed
                        </Button>
                    </div>
                    {view === "events" && (
                        currentItems.map((event: EventData) => (
                            <div onClick={() => {
                                setIsSidebarOpen(true);
                                setSelectedEvent(event);
                                setSelectedEventImageUrl(memoizedImageUrls[event.id]);
                            }}
                                key={event.id}
                                className="flex flex-col cursor-pointer w-full gap-8">
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-xl font-semibold text-white/70 tracking-wider">{format(parseISO(event.starts_at as string), 'yyyy-MM-dd')}</h2>
                                    <hr />
                                </div>
                                <div className="flex gap-4 border border-white/10 p-4 rounded-xl h-[240px]">
                                    <div className="flex flex-col items-center justify-center gap-4 border rounded-xl border-white/10 aspect-square h-fit">
                                        {memoizedImageUrls[event.id] && (
                                            <Image
                                                src={memoizedImageUrls[event.id]}
                                                alt=""
                                                width={200}
                                                height={200}
                                                objectFit="cover"
                                            />
                                        ) || (
                                                <div className="w-full h-full flex items-center justify-center bg-white/10 rounded-xl">
                                                    <p className="text-center font-medium">No image available 😔</p>
                                                </div>
                                            )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h1 className="text-2xl font-bold tracking-wider line-clamp-2">{event.event_title}</h1>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-lg text-white/70">{format(parseISO(event.starts_at as string), 'yyyy-MM-dd HH:mm')}</p>
                                            <p className="text-white/60">{event.event_address}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Ticket className="text-white/70 h-6 w-6" />
                                                {event?.ticket_price === "FREE" && (
                                                    <p className="text-sm text-white/60 font-bold tracking-wide">FREE</p>
                                                ) || (
                                                        <p className="text-sm text-white/60 font-bold tracking-wide">{event?.ticket_price}$</p>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) || (
                            <GroupPostsSection groupId={groupId as any} />
                        )}

                    {totalItems > 0 && (
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
