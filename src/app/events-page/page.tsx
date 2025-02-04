"use client";

import { Button } from "@/components/ui/button";
import { useCityContext } from "@/providers/cityContextProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { EventData } from "@/types/types";
import { Pagination } from "@mui/material";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format, parseISO } from "date-fns";
import { Ticket } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import stringSimilarity from "string-similarity";

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

    useEffect(() => {
        if (!loading && !userId) {
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
    const currentItems = memoizedEvents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const pageCount = Math.ceil(memoizedEvents.length / itemsPerPage);

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
    };

    return (
        <>
            <div className="max-w-[1200px] w-full justify-self-center pt-24 flex flex-col gap-4">
                <div className="flex flex-wrap max-[800px]:justify-center gap-8">
                    {currentItems.map((event) => (
                        <div key={event.id} className="flex flex-col gap-2 w-[280px] h-[440px]  border rounded-md border-white/10 p-4">
                            <div className="flex items-center justify-center border rounded-md border-white/10 w-full aspect-square">
                                {memoizedImageUrls[event.id] && (
                                    <Image
                                        src={memoizedImageUrls[event.id]}
                                        alt={event.event_title || ""}
                                        width={2000}
                                        height={2000}
                                        objectFit="cover"
                                    />
                                ) || (
                                        <div className="w-full h-full flex items-center justify-center bg-white/10 rounded-md">
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
                                        <p className="text-sm font-bold tracking-wide text-white/70">{event?.ticket_price}</p>
                                    </div>
                                </div>
                                <Button className="rounded-md mt-2 w-fit text-sm"
                                    onClick={() => router.push(`/event-page/${event?.id}`)}>View event</Button>
                            </div>
                        </div>
                    ))}
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
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            },
                        },
                    }}
                />
            </div>
        </>
    );
}
