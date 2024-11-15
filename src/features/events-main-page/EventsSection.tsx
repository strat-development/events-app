import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { EventData } from "@/types/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import stringSimilarity from "string-similarity";
import { format, startOfToday, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import Link from "next/link";
import Image from "next/image";
import { UserGroupsSection } from "./UserGroupsSection";
import { Pagination } from "@mui/material";

export const EventsSection = () => {
    const supabase = createClientComponentClient<Database>();
    const { userInterests } = useUserContext();
    const [events, setEvents] = useState<{ [date: string]: EventData[] }>({});
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [imageUrls, setImageUrls] = useState<{ [eventId: string]: string }>({});
    const eventIds = Object.values(events).flat().map((event) => event.id);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const handleDateChange = (date: Date) => {
        setSelectedDate(date);
    };

    useQuery(
        ['events', userInterests, selectedDate],
        async () => {
            if (!userInterests || userInterests.length === 0) return [];

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
                    setImageUrls(urlMapping);
                })
                .catch(console.error);
        }
    }, [images]);

    const memoizedEvents = useMemo(() => events, [events]);
    const memoizedImageUrls = useMemo(() => imageUrls, [imageUrls]);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = Object.values(memoizedEvents).flat().slice(startIndex, endIndex);
    const pageCount = Math.ceil((Object.values(memoizedEvents).flat().length ?? 0) / itemsPerPage);

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
    };


    return (
        <>
            <div className="flex gap-16 items-start">
                <div className="flex flex-col gap-8">
                    <Calendar onDayClick={handleDateChange} />
                    <UserGroupsSection />
                </div>
                <div className="flex flex-col">
                    <h1>EVENTS</h1>
                    {currentItems.map((event: EventData) => (
                        <div key={event.id} className="flex flex-col gap-8">
                            <h2 className="text-xl font-bold">{format(parseISO(event.starts_at as string), 'yyyy-MM-dd')}</h2>
                            <div className="flex gap-4">
                                <div className="flex flex-col gap-4">
                                    {memoizedImageUrls[event.id] && (
                                        <Image
                                            src={memoizedImageUrls[event.id]}
                                            alt=""
                                            width={200}
                                            height={200}
                                        />
                                    )}
                                </div>
                                <div className="flex flex-col gap-4">
                                    <Link href={`/event-page/${event.id}`}>
                                        <h1 className="text-2xl font-bold">{event.event_title}</h1>
                                    </Link>
                                    <p>{event.starts_at}</p>
                                    <p>{event.event_address}</p>
                                    <p>{event.ticket_price}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    <Pagination
                        className="self-center"
                        count={pageCount}
                        page={currentPage}
                        onChange={handlePageChange}
                        variant="outlined"
                        color="secondary"
                    />
                </div>
            </div>
        </>
    );
};
