"use client";

import { useCityContext } from "@/providers/cityContextProvider";
import { Database } from "@/types/supabase";
import { EventData } from "@/types/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import stringSimilarity from "string-similarity";

export default function EventsPage() {
    const supabase = createClientComponentClient<Database>();
    const [events, setEvents] = useState<EventData[]>([]);
    const [eventInterestFromUrl, setEventInterestFromUrl] = useState<string | null>(null);
    const [eventCityFromUrl, setEventCityFromUrl] = useState<string | null>(null);

    const { city } = useCityContext();

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const searchParam = searchParams.get('search');
        const cityParam = searchParams.get('city');

        setEventCityFromUrl(cityParam);
        setEventInterestFromUrl(searchParam);
    }, []);

    useQuery(
        ['events', eventInterestFromUrl, eventCityFromUrl, city],
        async () => {
            if (!eventInterestFromUrl && !eventCityFromUrl && !city) return [];

            const cityFilter = eventCityFromUrl || city;

            console.log('eventCityFromUrl:', eventCityFromUrl);
            console.log('city from context:', city);
            console.log('cityFilter:', cityFilter);

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
                const matchesInterest = eventTopics?.interests.some((interest: { name: string }) =>
                    interest.name.toLowerCase() === eventInterestFromUrl?.toLowerCase()
                );

                return matchesInterest;
            });

            const similarityThreshold = 0.1;
            const similarMatches = exactMatches.length > 0 ? exactMatches : data.filter((event: EventData) => {
                const eventTopics = event.event_topics as { interests: { name: string }[] };
                const matchesInterest = eventTopics && Array.isArray(eventTopics.interests) && eventTopics.interests.some((interest: { name: string }) => {
                    const similarityScores = eventInterestFromUrl ? [stringSimilarity.compareTwoStrings(
                        interest.name.toLowerCase(), eventInterestFromUrl.toLowerCase()
                    )] : [];
                    return similarityScores.some(score => score >= similarityThreshold);
                });

                return matchesInterest;
            });

            return similarMatches;
        },
        {
            onSuccess: (data) => {
                setEvents(data);
            }
        }
    );

    return (
        <div className="h-screen flex items-center">
            {events.map((event) => (
                <Link href={`/event-page/${event.id}`}
                    key={event.id}>{event.event_title}</Link>

            ))}
        </div>
    );
}