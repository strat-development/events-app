"use client"

import { Button } from "@/components/ui/button"
import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { TextEditor } from "../TextEditor"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import { useUserContext } from "@/providers/UserContextProvider"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider"
import Link from "next/link"
import Image from "next/image"

interface EventInfoSectionProps {
    eventId: string
}

export const EventInfoSection = ({ eventId }: EventInfoSectionProps) => {
    const supabase = createClientComponentClient<Database>()
    const [eventDescription, setEventDescription] = useState<string>()
    const [eventGroup, setEventGroup] = useState<string>()
    const [isExpanded, setIsExpanded] = useState(false)
    const [isSetToEdit, setIsSetToEdit] = useState(false)
    const [eventHostId, setEventHostId] = useState<string>()
    const [attendeesId, setAttendeesId] = useState<string[]>([])
    const [imageUrls, setImageUrls] = useState<{ publicUrl: string }[]>([])
    const [profileImageUrls, setProfileImageUrls] = useState<{ publicUrl: string }[]>([]);
    const queryClient = useQueryClient()
    const { userId } = useUserContext()
    const { eventCreatorId } = useGroupOwnerContext()

    useQuery(['events-description'], async () => {
        const { data, error } = await supabase
            .from("events")
            .select("event_description, event_group, created_by")
            .eq("id", eventId)

        if (error) {
            throw error
        }

        if (data) {
            setEventDescription(data[0].event_description as string)
            setEventGroup(data[0].event_group as string)
            setEventHostId(data[0].created_by as string)
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
                .limit(3)

            if (error) {
                throw new Error(error.message)
            }

            if (data) {
                setAttendeesId(data.map((attendee) => attendee.users?.id as string))
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

    const groupInfo = useQuery(
        ['group-info'],
        async () => {
            const { data, error } = await supabase
                .from("groups")
                .select("group_name, group_country, group_city")
                .eq("id", eventGroup as string)

            if (error) {
                throw new Error(error.message)
            }

            return data
        },
        {
            enabled: !!eventGroup,
        })

    const { data: images, isLoading } = useQuery(
        ['group-pictures', eventGroup],
        async () => {
            const { data, error } = await supabase
                .from('group-pictures')
                .select('*')
                .eq('group_id', eventGroup as string)
            if (error) {
                throw error;
            }
            return data || [];
        },
        {
            enabled: !!eventGroup
        }
    );

    useEffect(() => {
        if (images) {
            Promise.all(images.map(async (image) => {
                const { data: publicURL } = await supabase.storage
                    .from('group-pictures')
                    .getPublicUrl(image.hero_picture_url || "")

                return { publicUrl: publicURL.publicUrl };

            }))
                .then((publicUrls) => setImageUrls(publicUrls))
                .catch(console.error);
        }
    }, [images]);

    const { data: profileImages } = useQuery(
        ['profile-pictures', attendeesId],
        async () => {
            const { data, error } = await supabase
                .from('profile-pictures')
                .select('*')
                .eq('user_id', attendeesId)
            if (error) {
                throw error;
            }
            return data || [];
        },
        {
            enabled: !!attendeesId
        }
    );

    useEffect(() => {
        if (profileImages) {
            Promise.all(profileImages.map(async (image) => {
                const { data: publicURL } = await supabase.storage
                    .from('profile-pictures')
                    .getPublicUrl(image.image_url)

                return { publicUrl: publicURL.publicUrl };

            }))
                .then((publicUrls) => setProfileImageUrls(publicUrls))
                .catch(console.error);
        }
    }, [images]);

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
                                    className={`overflow-hidden ${isExpanded ? 'max-h-full' : 'max-h-24'} ${!isExpanded && 'blur-effect'}`}></div>
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
                                    <Button onClick={() => setIsSetToEdit(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={() => {
                                        editEventDescriptionMutation.mutate(eventDescription as string)

                                        setIsSetToEdit(false)
                                    }}>
                                        Save changes
                                    </Button>
                                </div>

                            )}
                    </div>
                    {eventCreatorId === userId && !isSetToEdit &&
                        <div className="flex gap-4">
                            <Button onClick={() => setIsSetToEdit(true)}>
                                Edit
                            </Button>
                        </div>
                    }
                </div>
                <div className="flex flex-col gap-4">
                    <h2 className='text-2xl font-bold'>Attendees</h2>
                    <div className='grid grid-cols-4'>
                        {eventAttendees.data?.map((attendee) => (
                            <Link href={`/user-profile/${attendee.users?.id}`} key={attendee.users?.id}>
                                <div key={attendee.users?.id}
                                    className='flex flex-col gap-2 items-center border p-4 rounded-lg'>
                                    <Image className="rounded-full shadow-xl"
                                        src={profileImageUrls[0]?.publicUrl} width={50} height={50} alt="" />
                                    <span className=''>{attendee.users?.full_name}</span>
                                    {attendee.users?.id === eventHostId && (
                                        <span className='text-sm text-red-500'>Host</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
                <div>
                    <h2 className='text-2xl font-bold'>Group Info</h2>
                    <Link href={`/group-page/${eventGroup}`}>
                        <div className='flex gap-4'>
                            <Image src={imageUrls[0]?.publicUrl} width={200} height={200} alt="" />
                            <div className="flex flex-col gap-4">
                                <span>Group Name: {groupInfo.data?.[0].group_name}</span>
                                <span>Group Country: {groupInfo.data?.[0].group_country}</span>
                                <span>Group City: {groupInfo.data?.[0].group_city}</span>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            <Toaster />
        </>
    )
}