"use client";

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

    useEffect(() => {
        const searchParam = new URLSearchParams(window.location.search).get('search');
        setEventInterestFromUrl(searchParam);
    }, []);

    useQuery(
        ['events', eventInterestFromUrl],   
        async () => {
            if (!eventInterestFromUrl) return [];

            const { data, error } = await supabase
                .from("events")
                .select("*");

            if (error) {
                console.error('Error fetching events:', error);
                throw new Error(error.message);
            }

            const exactMatches = data.filter((event: EventData) => {
                const eventTopics = event.event_topics as { interests: { name: string }[] };
                return eventTopics?.interests.some((interest: { name: string }) =>
                    interest.name.toLowerCase() === eventInterestFromUrl.toLowerCase()
                );
            });

            if (exactMatches.length > 0) {
                return exactMatches;
            }

            const similarityThreshold = 0.1;
            const similarMatches = data.filter((event: EventData) => {
                const eventTopics = event.event_topics as { interests: { name: string }[] };
                return eventTopics && Array.isArray(eventTopics.interests) && eventTopics.interests.some((interest: { name: string }) => {
                    const similarity = stringSimilarity.compareTwoStrings(
                        interest.name.toLowerCase(),
                        eventInterestFromUrl.toLowerCase()
                    );
                    return similarity >= similarityThreshold;
                });
            });

            return similarMatches;
        },
        {
            enabled: !!eventInterestFromUrl,
            onSuccess: (data) => {
                setEvents(data);
            }
        }
    );


    return (
        <div className="h-screen flex items-center">
            <ul>
                {events.map((event) => (
                    <Link href={`/event-page/${event.id}`}
                        key={event.id}>{event.event_title}</Link>
                ))}
            </ul>
        </div>
    );
}