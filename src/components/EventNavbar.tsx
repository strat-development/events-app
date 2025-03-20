"use client"

import { LogIn, LogOut, Ticket } from "lucide-react"
import { Button } from "./ui/button"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/supabase"
import { Toaster } from "./ui/toaster"
import { toast } from "./ui/use-toast"
import { useMutation, useQuery, useQueryClient } from "react-query"
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
    const queryClient = useQueryClient()
    const { userId, userName, userEmail } = useUserContext()
    const [groupId, setGroupId] = useState<string>("")
    const [groupName, setGroupName] = useState<string>("")

    const groupData = useQuery(
        ["group", groupId],
        async () => {
            const { data, error } = await supabase
                .from("groups")
                .select("group_name")
                .eq('id', groupId)

            if (error) {
                console.error("Error fetching group data:", error.message)
                throw new Error(error.message)
            }

            if (data) {
                setGroupName(data[0].group_name || "")
            }

            return data
        },
        {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
        })

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
            setGroupId(data.event_group || "")
        }
    },
        {
            cacheTime: 10 * 60 * 1000,
        })

    const addAttendee = useMutation(async () => {
        const { data, error } = await supabase
            .from("event-attendees")
            .upsert({
                user_id: userId,
                event_id: eventId
            })

        if (error) {
            throw error
        }

        const emailResponse = await fetch('/api/attending-event-mail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userEmail,
                userFullName: userName,
                groupName: groupName,
                visitDate: eventData?.map((event) => event.starts_at),
                eventTitle: eventData?.map((event) => event.event_title),
                eventAddress: eventData?.map((event) => event.event_address)
            })
        });

        if (!emailResponse.ok) {
            throw new Error('Failed to send emails');
        }
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('attendee')

            toast({
                title: "You have successfully registered for this event",
                description: "You can now attend this event",
            })
        }
    })

    const addTicket = useMutation(async () => {
        const { data, error } = await supabase
            .from("event-tickets")
            .insert({
                event_id: eventId,
                user_id: userId,
                user_fullname: userName,
                user_email: userEmail,
                event_starts_at: eventData?.map((event) => event.starts_at),
                event_title: eventData?.map((event) => event.event_title),
                event_address: eventData?.map((event) => event.event_address),
                ticket_price: eventData?.map((event) => event.ticket_price)
            })

        if (error) {
            throw error
        }

        return data
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('ticket')
        }
    })

    const removeTicket = useMutation(async () => {
        const { data, error } = await supabase
            .from("event-tickets")
            .delete()
            .eq("user_id", userId)
            .eq("event_id", eventId || "")

        if (error) {
            throw error
        }

        return data
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('ticket')
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
            .eq("user_id", userId)
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
            .eq("user_id", userId)
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
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('attendee')
        }
    })

    const memoizedEventData = useMemo(() => eventData, [eventData])

    return (
        <>
            <div className="py-4 flex justify-center items-center w-full border-t-2 border-t-white/10 bg-[#131414]">
                <div className="flex max-w-[1200px] w-full self-center justify-end min-[640px]:justify-between items-center">
                    {memoizedEventData?.map((event) => (
                        <>
                            <div className="flex flex-col max-[640px]:hidden">
                                <p className="text-lg font-medium text-white/70">{format(parseISO(event.starts_at as string), 'yyyy-MM-dd HH:mm')} - {format(parseISO(event.ends_at as string), 'HH:mm')}</p>
                                <p className="text-white/50">{event.event_address}</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex flex-col">
                                    <div className="flex gap-2 mt-1 items-center">
                                        <Ticket size={20} />
                                        {event?.ticket_price !== null && event.ticket_price > 10000 ? (
                                            <p className="text-sm text-white/60 font-bold tracking-wide">FREE</p>
                                        ) : (
                                            <p className="text-sm text-white/60 font-bold tracking-wide">{event?.ticket_price}$</p>
                                        )}
                                    </div>
                                    <p className="text-sm text-white/60">
                                        {availableSpots > 10000 ? "No spot limits" : `${availableSpots} spots available`}
                                    </p>
                                </div>
                                <ShareDialog />
                                {attendeeData.length > 0 ? (
                                    <Button variant="ghost"
                                        className="text-red-500 h-fit"
                                        onClick={() => {
                                            removeAttendee.mutateAsync()
                                            removeTicket.mutateAsync()
                                        }}>
                                        <LogOut size={20} />
                                    </Button>
                                ) : (
                                    availableSpots <= 0 ? (
                                        <Button className="h-fit"
                                            disabled>
                                            Sold out
                                        </Button>
                                    ) : (
                                        <Button className="text-green-500"
                                            variant="ghost"
                                            onClick={() => {
                                                addAttendee.mutateAsync()
                                                addTicket.mutateAsync()
                                            }}>
                                            <LogIn size={20} />
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