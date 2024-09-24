import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { EventData } from "@/types/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import { useQuery } from "react-query";
import stringSimilarity from "string-similarity";
import { format, startOfToday, parseISO, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

export const EventsSection = () => {
    const supabase = createClientComponentClient<Database>();
    const { userInterests } = useUserContext();
    const [events, setEvents] = useState<{ [date: string]: EventData[] }>({});
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
                .gte('starts_at', today);

            if (error) {
                console.error('Error fetching events:', error);
                throw new Error(error.message);
            }

            const exactMatches = data.filter((event: EventData) => {
                const eventTopics = event.event_topics as { interests: { name: string }[] };
                return eventTopics?.interests.some((interest: { name: string }) =>
                    userInterests.includes(interest.name)
                );
            });

            const similarityThreshold = 0.1;
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

            return filteredEvents;
        },
        {
            enabled: !!userInterests && userInterests.length > 0,
            onSuccess: (data) => {
                const groupedEvents = data.reduce((acc: { [date: string]: EventData[] }, event: EventData) => {
                    const eventDate = format(parseISO(event.starts_at as string), 'yyyy-MM-dd');
                    if (!acc[eventDate]) {
                        acc[eventDate] = [];
                    }
                    acc[eventDate].push(event);
                    return acc;
                }, {});
                setEvents(groupedEvents);
            }
        }
    );

    return (
        <>
            <div className="flex gap-16">
                <Calendar onDayClick={handleDateChange} />
                <div className="flex flex-col">
                    {Object.keys(events).map((date) => (
                        <div key={date}>
                            <h2 className="text-xl font-bold">{date}</h2>
                            {events[date].map((event) => (
                                <div key={event.id}>{event.event_title}</div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};