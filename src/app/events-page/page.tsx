"use client";

import { Database } from "@/types/supabase";
import { EventData } from "@/types/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "react-query";

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
            const { data, error, status } = await supabase
                .from("events")
                .select("*")
                .contains('event_topics', { interests: [{ name: eventInterestFromUrl }] });

            if (error) {
                console.error('Error fetching data:', error);
                throw new Error(error.message);
            } else {
                setEvents(data);
            }
        },
        {
            enabled: !!eventInterestFromUrl,    
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