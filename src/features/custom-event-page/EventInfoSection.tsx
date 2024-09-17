"use client"

import { Button } from "@/components/ui/button"
import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { TextEditor } from "../TextEditor"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"

interface EventInfoSectionProps {
    eventId: string
}

export const EventInfoSection = ({ eventId }: EventInfoSectionProps) => {
    const supabase = createClientComponentClient<Database>()
    const [eventDescription, setEventDescription] = useState<string>()
    const [isExpanded, setIsExpanded] = useState(false)
    const [isSetToEdit, setIsSetToEdit] = useState(false)
    const queryClient = useQueryClient()

    useQuery(['events-description'], async () => {
        const { data, error } = await supabase
            .from("events")
            .select("event_description")
            .eq("id", eventId)

        if (error) {
            throw error
        }

        if (data) {
            setEventDescription(data[0].event_description as string)
        }
    })

    const eventAttendees = useQuery(
        ['attendees-data'],
        async () => {
            const { data, error } = await supabase
                .from("attendees")
                .select(`
                users (
                    *
                )`)
                .eq("event_id", eventId)

            if (error) {
                throw new Error(error.message)
            }

            return data
        },
        {
            enabled: !!eventId,
        })

    const editEventDescriptionMutation = useMutation(
        async (newEventDescription: string) => {
            const { data, error } = await supabase
                .from("events")
                .update({ event_description: newEventDescription })
                .eq("id", eventId)

            if (error) {
                throw error
            }

            if (data) {
                setIsSetToEdit(false)
            }
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('events')
                toast({
                    title: "Success",
                    description: "Description updated successfully",
                });
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to update description",
                    variant: "destructive"
                });
            }
        })

    return (
        <>
            <div className="flex gap-8">
                <div className="flex flex-col gap-4">
                    <h2 className='text-2xl font-bold'>Little bit about us</h2>
                    <div className='relative'>
                        {isSetToEdit === false && (
                            <>
                                <div
                                    dangerouslySetInnerHTML={{ __html: eventDescription as string }}
                                    className={`overflow-hidden ${isExpanded ? 'max-h-full' : 'max-h-24'} ${!isExpanded && 'blur-effect'}`}
                                ></div>
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className='text-blue-500'>
                                    {isExpanded ? 'Show less' : 'Show more'}
                                </button>
                            </>
                        ) || (
                                <div className="flex flex-col gap-4">
                                    <TextEditor
                                        editorContent={eventDescription as string}
                                        onChange={setEventDescription}
                                    />
                                    <Button onClick={() => {
                                        editEventDescriptionMutation.mutate(eventDescription as string)

                                        setIsSetToEdit(false)
                                    }}>
                                        Save changes
                                    </Button>
                                </div>

                            )}
                    </div>
                    <div className="flex gap-4">
                        <Button onClick={() => setIsSetToEdit(true)}>
                            Edit
                        </Button>
                        <Button onClick={() => setIsSetToEdit(false)}>
                            Cancel
                        </Button>
                    </div>

                </div>
                <div className="flex flex-col gap-4">
                    <h2 className='text-2xl font-bold'>Attendees</h2>
                    <div className='grid grid-cols-4'>
                        {eventAttendees.data?.map((attendee) => (
                            <div key={attendee.users?.id} className='flex flex-col gap-2'>
                                <span className='text-sm'>{attendee.users?.full_name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Toaster />
        </>
    )
}