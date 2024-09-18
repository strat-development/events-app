"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider"
import { useUserContext } from "@/providers/UserContextProvider"
import { Database } from "@/types/supabase"
import { EventAttendeesData, EventData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"

interface EventHeroProps {
    eventId: string
}

export const EventHero = ({ eventId }: EventHeroProps) => {
    const supabase = createClientComponentClient<Database>()
    const queryClient = useQueryClient()
    const { userId } = useUserContext()
    const { eventCreatorId } = useGroupOwnerContext()

    const [eventData, setEventData] = useState<EventData[]>()
    const [eventNameToEdit, setEventNameToEdit] = useState(false)
    const [newEventName, setNewEventName] = useState("")
    const [eventAddressToEdit, setEventAddressToEdit] = useState(false)
    const [newEventAddress, setNewEventAddress] = useState("")
    const [attendeesData, setEventAttendeessData] = useState<EventAttendeesData[]>()

    useQuery(['events'], async () => {
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

    useQuery(['event-members'], async () => {
        const { data, error } = await supabase
            .from("attendees")
            .select(`
                users (
                    *
                )`)
            .eq("event_id", eventId)

        if (error) {
            throw error
        }

        if (data) {
            setEventAttendeessData(data as unknown as EventAttendeesData[])
        }
    })

    const editEventNameMutation = useMutation(async (newEventName: string) => {
        const { data, error } = await supabase
            .from("events")
            .update({ event_title: newEventName })
            .eq("created_by", userId)
            .eq("id", eventId)
        if (error) {
            throw error
        }

        if (data) {
            setEventNameToEdit(false)
        }
    }, {
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Event name changed successfully",
            });

            queryClient.invalidateQueries('events')
        },
        onError: () => {
            toast({
                title: "Error",
                description: "An error occurred while changing the event name",
            });
        }
    })

    const editEventAddressMutation = useMutation(async () => {
        const { data, error } = await supabase
            .from("events")
            .update({ event_address: newEventAddress })
            .eq("created_by", userId)
            .eq("id", eventId)
        if (error) {
            throw error
        }

        if (data) {
            setEventAddressToEdit(false)
        }
    }, {
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Event location changed successfully",
            });

            queryClient.invalidateQueries('events')
        },
        onError: () => {
            toast({
                title: "Error",
                description: "An error occurred while changing the event location",
            });
        }
    })

    return (
        <div className="flex flex-col gap-4">
            {eventData?.map((event) => (
                <div key={event.id} className="bg-white p-4 rounded-md shadow-md">
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-4">
                            <h1>{event.event_title}</h1>

                            {userId === eventCreatorId && !eventNameToEdit && (
                                <Button onClick={() => setEventNameToEdit(true)}>Edit</Button>
                            )}
                        </div>
                        <div>
                            {eventNameToEdit && (
                                <div className="flex gap-4">
                                    <Input placeholder="New event name"
                                        value={newEventName}
                                        onChange={(e) => setNewEventName(e.target.value)}
                                    />
                                    <Button onClick={() => setEventNameToEdit(false)}>Cancel</Button>
                                    <Button onClick={() => {
                                        editEventNameMutation.mutateAsync(newEventName)

                                        setEventNameToEdit(false)
                                    }}>Save</Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                            <p>{event.event_address}</p>
                            {userId === eventCreatorId && !eventAddressToEdit && (
                                <Button onClick={() => setEventAddressToEdit(true)}>
                                    Edit
                                </Button>
                            )}
                        </div>
                        <div>
                            {eventAddressToEdit && (
                                <div className="flex gap-4">
                                    <Input placeholder="New event address"
                                        value={newEventAddress}
                                        onChange={(e) => setNewEventAddress(e.target.value)}
                                    />
                                    <Button onClick={() => setEventAddressToEdit(false)}>Cancel</Button>
                                    <Button onClick={() => {
                                        editEventAddressMutation.mutateAsync()

                                        setEventAddressToEdit(false)
                                    }}>Save</Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        {attendeesData?.map((member) => (
                            <div key={member.id}>
                                <p>Attendees count: {attendeesData?.length || 0}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

