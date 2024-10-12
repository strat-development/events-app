"use state"

import { useUserContext } from "@/providers/UserContextProvider"
import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { useQuery } from "react-query"
import { Button } from "../ui/button"
import { useState } from "react"
import { DeleteEventDialog } from "./modals/DeleteEventDialog"
import { EditEventDialog } from "./modals/EditEventDialog"

export const EventCard = () => {
    const supabase = createClientComponentClient<Database>()
    const { userId } = useUserContext()
    const [attendingVisits, setAttendingVisits] = useState(true)

    const fetchedEventsByAttendees = useQuery(
        ['events'],
        async () => {
            const { data, error } = await supabase
                .from("event-attendees-linker")
                .select(`
            events (
                *
            )`)
                .eq('attendee_id', userId)

            if (error) {
                console.error("Error fetching events:", error.message)
                throw new Error(error.message)
            }

            return data
        },
        {
            enabled: !!userId,
        }
    )

    const fetchedEventsByHosts = useQuery(
        ['events'],
        async () => {
            const { data, error } = await supabase
                .from("events")
                .select(`
            *
            `)
                .eq('created_by', userId)

            if (error) {
                console.error("Error fetching events:", error.message)
                throw new Error(error.message)
            }

            return data
        },
        {
            enabled: !!userId,
        }
    )

    return (
        <>

            <div className="flex flex-col gap-4">
                <div className="flex">
                    <Button variant="link"
                        onClick={() => {
                            setAttendingVisits(true)

                            fetchedEventsByAttendees.refetch()
                        }}>
                        Attending
                    </Button>
                    <Button variant="link"
                        onClick={() => {
                            setAttendingVisits(false)

                            fetchedEventsByHosts.refetch()
                        }}>
                        Hosting
                    </Button>
                </div>
                <h1>Events</h1>

                {attendingVisits === true && (
                    fetchedEventsByAttendees.data?.map((event) => (
                        <div key={event.events?.event_title}>
                            <Link href={`/dashboard/event-page/${event.events?.id}`}>
                                <p>{event.events?.event_title}</p>
                            </Link>
                        </div>
                    ))
                ) || (
                        fetchedEventsByHosts.data?.map((event) => (
                            <div className="flex"
                                key={event.event_title}>
                                <Link href={`/dashboard/event-page/${event.id}`}>
                                    <p>{event.event_title}</p>
                                </Link>

                                <div className="flex gap-4">
                                    <EditEventDialog
                                        eventId={event.id}
                                    />
                                    <DeleteEventDialog
                                        eventId={event.id}
                                    />
                                </div>
                            </div>

                        ))
                    )}
            </div>
        </>
    )
}