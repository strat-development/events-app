"use client"

import { Flag } from "lucide-react"
import { Button } from "./ui/button"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/supabase"
import { Toaster } from "./ui/toaster"
import { toast } from "./ui/use-toast"
import { useMutation, useQuery } from "react-query"
import { useState } from "react"
import { EventData } from "@/types/types"
import { useUserContext } from "@/providers/UserContextProvider"

interface EventNavbarProps {
    eventId: string
}

export const EventNavbar = ({ eventId }: EventNavbarProps) => {
    const supabase = createClientComponentClient<Database>()
    const [eventData, setEventData] = useState<EventData[]>()
    const [attendeeData, setAttendeeData] = useState<string[]>([])
    const { userId } = useUserContext()

    useQuery(['event-data'], async () => {
        const { data, error } = await supabase
            .from("events")
            .select("*")
            .eq("id", eventId)

        if (error) {
            throw error
        }

        if (data) {
            setEventData(data)
        }
    })

    const addAttendee = useMutation(async () => {
        const { data, error } = await supabase
            .from("attendees")
            .upsert({
                id: userId,
                event_id: eventId
            })

        if (error) {
            throw error
        }

        if (data) {
            toast({
                title: "You have successfully registered for this event",
                description: "You can now attend this event",
            })
        }
    })

    const fetchAttendee = useQuery(['attendee'], async () => {
        const { data, error } = await supabase
            .from("attendees")
            .select("*")
            .eq("id", userId)
            .eq("event_id", eventId)

        if (error) {
            throw error
        }

        if (data) {
            setAttendeeData(data as unknown as string[])
        }

        return data
    },
        {
            enabled: !!userId && !!eventId
        })

    const removeAttendee = useMutation(async () => {
        const { data, error } = await supabase
            .from("attendees")
            .delete()
            .eq("id", userId)
            .eq("event_id", eventId)

        if (error) {
            throw error
        }

        if (data) {
            toast({
                title: "You have successfully unregistered for this event",
                description: "You can no longer attend this event",
            })
        }
    })

    const copyEventLink = async () => {
        const url = `${window.location.origin}/event/${eventId}`
        await navigator.clipboard.writeText(url)
        toast({
            title: "Event link copied",
            description: "You can now share this event link with others",
        })
    }

    return (
        <>
            <div className="sticky bottom-0 py-4 flex justify-center items-center w-full border-t-2 bg-white">
                <div className="flex max-w-[1200px] w-full self-center justify-between">
                    {eventData?.map((event) => (
                        <>
                            <div>
                                <p>{event.starts_at}</p>
                                <p>{event.event_address}</p>

                            </div>
                            <div className="flex gap-4">
                                <p>{event.ticket_price}</p>
                                <Button variant="outline"
                                    onClick={() => {
                                        copyEventLink()
                                    }}>
                                    <div className="flex gap-1 items-center">
                                        <Flag size={16} />
                                        <p>Share</p>
                                    </div>
                                </Button>
                                {attendeeData.length > 0 ? (
                                    <Button onClick={() => {
                                        removeAttendee.mutateAsync()
                                    }}
                                        variant="destructive">
                                        Unattend
                                    </Button>
                                ) : (
                                    <Button onClick={() => {
                                        addAttendee.mutateAsync()
                                    }}
                                        variant="default">
                                        Attend
                                    </Button>
                                )}
                            </div>
                        </>
                    ))}
                </div>
                <Toaster />
            </div>
        </>
    )
}