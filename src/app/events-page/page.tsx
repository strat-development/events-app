"use client";

import { useCityContext } from "@/providers/cityContextProvider";
import { Database } from "@/types/supabase";
import { EventData } from "@/types/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import Link from "next/link";
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

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const searchParam = searchParams.get('search');
        const cityParam = searchParams.get('city');

        setEventCityFromUrl(cityParam);
        setEventInterestFromUrl(searchParam);
    });

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

            const similarityThreshold = 0.1;
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
        },
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
    }, [imageQuery.data]);

    const memoizedEvents = useMemo(() => events, [events]);
    const memoizedImageUrls = useMemo(() => imageUrls, [imageUrls]);

    return (
        <div className="h-screen flex flex-col items-center">
            {memoizedEvents.map((event) => (
                <div key={event.id} className="flex flex-col items-center mb-4">
                    {memoizedImageUrls[event.id] && (
                        <Image
                            src={memoizedImageUrls[event.id]}
                            alt={event.event_title || ""}
                            width={200}
                            height={200}
                        />
                    )}
                    <Link href={`/event-page/${event.id}`}>
                        <h1 className="text-2xl font-bold">{event.event_title}</h1>
                    </Link>
                    <p>{event.starts_at}</p>
                    <p>{event.event_address}</p>
                    <p>{event.ticket_price}</p>
                </div>
            ))}
        </div>
    );
}