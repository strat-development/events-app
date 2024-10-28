"use client"

import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { useMemo } from "react"
import { useQuery } from "react-query"

interface EventsSectionProps {
    groupId: string
}

export const EventsSection = ({ groupId }: EventsSectionProps) => {
    const supabase = createClientComponentClient<Database>()

    const events = useQuery(['upcoming-events'], async () => {
        const { data, error } = await supabase
            .from("events")
            .select("*")
            .gte("starts_at", new Date().toISOString())
            .order("starts_at", { ascending: true })
            .eq("event_group", groupId)

        if (error) {
            throw error
        }

        return data
    },
        {
            cacheTime: 10 * 60 * 1000,
        })

        const memoizedEvents = useMemo(() => events.data, [events.data])

    return (
        <>
            {events.isLoading && <p>Loading...</p>}

            {events.isSuccess && (
                <div className='flex flex-col gap-4'>
                    <h2 className='text-2xl font-bold'>Upcoming events</h2>
                    {memoizedEvents?.map(event => (
                        <Link href={`/dashboard/event-page/${event.id}`}
                            key={event.id} className='flex flex-col gap-2'>
                            <h3 className='text-lg font-bold'>{event.event_title}</h3>
                            <p>{event.starts_at}</p>
                            <p>{event.ticket_price}</p>
                        </Link>
                    ))}
                </div>
            )}
        </>
    )
}