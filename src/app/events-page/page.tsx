"use client";

import { useCityContext } from "@/providers/cityContextProvider";
import { Database } from "@/types/supabase";
import { EventData } from "@/types/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import stringSimilarity from "string-similarity";

export default function EventsPage() {
    const supabase = createClientComponentClient<Database>();
    const [events, setEvents] = useState<EventData[]>([]);
    const [eventInterestFromUrl, setEventInterestFromUrl] = useState<string | null>(null);
    const { city } = useCityContext();

    useEffect(() => {
        const searchParam = new URLSearchParams(window.location.search).get('search');
        setEventInterestFromUrl(searchParam);
    }, []);

    useQuery(
        ['events', eventInterestFromUrl, city],
        async () => {
            if (!eventInterestFromUrl && !city) return [];

            const { data, error } = await supabase
                .from("events")
                .select("*");

            if (error) {
                console.error('Error fetching events:', error);
                throw new Error(error.message);
            }

            const exactMatches = data.filter((event: EventData) => {
                const eventTopics = event.event_topics as { interests: { name: string }[] };
                const matchesInterest = eventTopics?.interests.some((interest: { name: string }) =>
                    interest.name.toLowerCase() === eventInterestFromUrl?.toLowerCase()
                );
                const matchesCity = city
                    ? event.event_address?.toLowerCase().includes(city.toLowerCase())
                    : true;
                return matchesInterest && matchesCity;
            });

            const similarityThreshold = 0.1;
            const similarMatches = exactMatches.length > 0 ? exactMatches : data.filter((event: EventData) => {
                const eventTopics = event.event_topics as { interests: { name: string }[] };
                const matchesInterest = eventTopics && Array.isArray(eventTopics.interests) && eventTopics.interests.some((interest: { name: string }) => {
                    const similarityScores = eventInterestFromUrl ? [stringSimilarity.compareTwoStrings(
                        interest.name.toLowerCase(),
                        eventInterestFromUrl.toLowerCase()
                    )] : [];
                    return Math.max(...similarityScores) >= similarityThreshold;
                });
                const matchesCity = city
                    ? event.event_address?.toLowerCase().includes(city.toLowerCase())
                    : true;
                return matchesInterest && matchesCity;
            });

            return similarMatches;
        },
        {
            enabled: !!eventInterestFromUrl || !!city,
            onSuccess: (data) => {
                setEvents(data);
            }
        }
    );

    return (
        <div className="h-screen flex items-center">
            <ul>
                {events.map((event) => (
                    <li key={event.id}>{event.event_title}</li>
                ))}
            </ul>
        </div>
    );
}