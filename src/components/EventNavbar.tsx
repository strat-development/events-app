"use client"

import { Flag, Ticket } from "lucide-react"
import { Button } from "./ui/button"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/supabase"
import { Toaster } from "./ui/toaster"
import { toast } from "./ui/use-toast"
import { useMutation, useQuery } from "react-query"
import { useMemo, useState } from "react"
import { EventData } from "@/types/types"
import { useUserContext } from "@/providers/UserContextProvider"
import { format, parseISO } from "date-fns";
import { ShareDialog } from "@/features/qr-code-generator/ShareDialog"

interface EventNavbarProps {
    eventId: string
}

export const EventNavbar = ({ eventId }: EventNavbarProps) => {
    const supabase = createClientComponentClient<Database>()
    const [eventData, setEventData] = useState<EventData[]>()
    const [attendeeData, setAttendeeData] = useState<string[]>([])
    const { userId } = useUserContext()

    useQuery(['event-navbar-data'], async () => {
        const { data, error } = await supabase
            .from("events")
            .select("*")
            .eq("id", eventId)
            .single()

        if (error) {
            throw error
        }

        if (data) {
            setEventData([data as unknown as EventData])
        }
    },
        {
            cacheTime: 10 * 60 * 1000,
        })

    const addAttendee = useMutation(async () => {
        const { data, error } = await supabase
            .from("event-attendees")
            .upsert({
                attendee_id: userId,
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

    const { data: attendeeCount, error: attendeeCountError } = useQuery(['attendee-count', eventId], async () => {
        const { count, error } = await supabase
            .from("event-attendees")
            .select("*", { count: 'exact', head: true })
            .eq("event_id", eventId)

        if (error) {
            throw error
        }

        return count
    },
        {
            enabled: !!eventId,
            cacheTime: 10 * 60 * 1000,
        })

    const availableSpots = eventData ? (eventData.reduce((acc, event) => acc + (event.attendees_limit as number), 0)) - (attendeeCount as number) : 0

    const fetchAttendee = useQuery(['attendee'], async () => {
        const { data, error } = await supabase
            .from("event-attendees")
            .select("*")
            .eq("attendee_id", userId)
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
            enabled: !!userId && !!eventId,
            cacheTime: 10 * 60 * 1000,
        })

    const removeAttendee = useMutation(async () => {
        const { data, error } = await supabase
            .from("event-attendees")
            .delete()
            .eq("attendee_id", userId)
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

    const memoizedEventData = useMemo(() => eventData, [eventData])

    return (
        <>
            <div className="py-4 flex justify-center items-center w-full border-t-2 border-t-white/10 bg-gradient-to-br from-[#050505] to-[#070707]">
                <div className="flex max-w-[1200px] w-full self-center justify-end min-[640px]:justify-between items-center">
                    {memoizedEventData?.map((event) => (
                        <>
                            <div className="flex flex-col max-[640px]:hidden">
                                <p className="text-lg font-medium">{format(parseISO(event.starts_at as string), 'yyyy-MM-dd HH:mm')}</p>
                                <p className="text-white/70">{event.event_address}</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex flex-col">
                                    <p className="text-lg text-white/70 font-medium">{availableSpots} spots left</p>
                                    <div className="flex gap-2 mt-1 items-center">
                                        <Ticket className="h-4 w-4" />
                                        <p className="text-sm font-bold tracking-wide text-white/70">{event.ticket_price}</p>
                                    </div>
                                </div>
                                <ShareDialog />
                                {attendeeData.length > 0 ? (
                                    <Button className="h-fit"
                                        onClick={() => {
                                            removeAttendee.mutateAsync()
                                        }}
                                        variant="destructive">
                                        Unattend
                                    </Button>
                                ) : (
                                    availableSpots <= 0 ? (
                                        <Button className="h-fit"
                                            disabled>
                                            Sold out
                                        </Button>
                                    ) : (
                                        <Button className="h-fit"
                                            onClick={() => {
                                                addAttendee.mutateAsync()
                                            }}>
                                            Attend
                                        </Button>
                                    )
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