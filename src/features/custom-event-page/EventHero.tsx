"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider"
import { useUserContext } from "@/providers/UserContextProvider"
import { EventData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { Database } from "@/types/supabase"
import { format, parseISO } from "date-fns"
import { UpdateEventHeroImageDialog } from "@/components/dashboard/modals/events/UpdateEventHeroImageDialog"
import { DeleteEventPictureDialog } from "@/components/dashboard/modals/events/DeleteEventPictureDialog"
import { EventReportDialog } from "@/components/dashboard/modals/contact/EventReportDialog"
import { usePathname } from "next/navigation"
import { Save } from "lucide-react"

interface EventHeroProps {
    eventId: string
}

export const EventHero = ({ eventId }: EventHeroProps) => {
    const supabase = createClientComponentClient<Database>()
    const queryClient = useQueryClient()
    const { userId } = useUserContext();
    const { eventCreatorId } = useGroupOwnerContext()
    const pathname = usePathname()
    const [eventData, setEventData] = useState<EventData[]>()
    const groupId = eventData?.[0].event_group
    const [eventNameToEdit, setEventNameToEdit] = useState(false)
    const [newEventName, setNewEventName] = useState("")
    const [imageUrls, setImageUrls] = useState<{ publicUrl: string }[]>([]);
    const [groupImageUrls, setGroupImageUrls] = useState<{ publicUrl: string }[]>([]);

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
    },
        {
            cacheTime: 10 * 60 * 1000,
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

    const { data: images, isLoading } = useQuery(
        ['event-pictures', eventId],
        async () => {
            const { data, error } = await supabase
                .from('event-pictures')
                .select('*')
                .eq('event_id', eventId)
            if (error) {
                throw error;
            }
            return data || [];
        },
        {
            enabled: !!eventId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    useEffect(() => {
        if (images) {
            Promise.all(images.map(async (image) => {
                const { data: publicURL } = await supabase.storage
                    .from('event-pictures')
                    .getPublicUrl(image.hero_picture_url || "")

                return { publicUrl: publicURL.publicUrl };

            }))
                .then((publicUrls) => setImageUrls(publicUrls))
                .catch(console.error);
        }
    }, [images]);

    const groupInfo = useQuery(
        ['group-info'],
        async () => {
            const { data, error } = await supabase
                .from("groups")
                .select("group_name, group_country, group_city")
                .eq("id", groupId || "")

            if (error) {
                throw new Error(error.message)
            }

            return data
        },
        {
            enabled: !!groupId,
            cacheTime: 10 * 60 * 1000,
        })

    const { data: groupImages } = useQuery(
        ['group-pictures', groupId],
        async () => {
            const { data, error } = await supabase
                .from('group-pictures')
                .select('*')
                .eq('group_id', groupId as string)
            if (error) {
                throw error;
            }
            return data || [];
        },
        {
            enabled: !!groupId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    useEffect(() => {
        if (groupImages) {
            Promise.all(groupImages.map(async (image) => {
                const { data: publicURL } = await supabase.storage
                    .from('group-pictures')
                    .getPublicUrl(image.hero_picture_url || "")

                return { publicUrl: publicURL.publicUrl };

            }))
                .then((publicUrls) => setGroupImageUrls(publicUrls))
                .catch(console.error);
        }
    }, [groupImages]);

    const memoizedEventData = useMemo(() => eventData, [eventData]);
    const memoizedImageUrls = useMemo(() => imageUrls, [imageUrls]);
    const memoizedGroupInfo = useMemo(() => groupInfo, [groupInfo])
    const memoizedGroupImages = useMemo(() => groupImageUrls, [groupImageUrls])

    return (
        <div className="flex flex-col gap-4 max-w-[1200px] w-full justify-self-center">
            {memoizedEventData?.map((event) => (
                <div key={event.id} className="rounded-md flex justify-between relative">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-4">
                                    <h1 className="text-3xl tracking-wider font-semibold">{event.event_title}</h1>

                                    {pathname.includes("dashboard") && eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 && !eventNameToEdit && (
                                        <Button onClick={() => setEventNameToEdit(true)}>Edit</Button>
                                    )}

                                </div>
                                <div className="flex flex-col gap-1 min-[900px]:hidden">
                                    <p className="text-lg text-white/70">{format(parseISO(event.starts_at as string), 'yyyy-MM-dd HH:mm')}</p>
                                    <p className="text-white/60">{event.event_address}</p>
                                </div>
                                <div className="min-[900px]:hidden">
                                    <EventReportDialog eventId={eventId} />
                                </div>
                            </div>
                            {pathname.includes("dashboard") && eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 && eventNameToEdit && (
                                <div className="flex gap-4">
                                    <Input placeholder="New event name"
                                        value={newEventName}
                                        onChange={(e) => setNewEventName(e.target.value)}
                                    />
                                    <Button onClick={() => setEventNameToEdit(false)}>Cancel</Button>
                                    <Button variant="ghost"
                                        className="w-fit text-blue-500" 
                                        onClick={() => {
                                            editEventNameMutation.mutateAsync(newEventName)

                                            setEventNameToEdit(false)
                                        }}><Save size={20} /></Button>
                                </div>
                            )}

                            <Link className="min-[900px]:hidden"
                                href={`/group-page/${groupId}`}>
                                <div className='flex gap-4 items-start'>
                                    {memoizedGroupImages?.map((image) => (
                                        <Image className="max-w-[48px] min-[900px]:max-w-[72px] rounded-md"
                                            key={image.publicUrl}
                                            src={image.publicUrl}
                                            alt=""
                                            width={200}
                                            height={200}
                                        />
                                    ))}
                                    <div className="flex flex-col">
                                        <h3 className="text-xl font-semibold tracking-wide">{memoizedGroupInfo.data?.[0].group_name}</h3>
                                        <p className="text-white/70">{memoizedGroupInfo.data?.[0].group_country}, {memoizedGroupInfo.data?.[0].group_city}</p>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex flex-col gap-4">
                                {memoizedImageUrls.map((image) => (
                                    <Image className="aspect-square min-[768px]:aspect-video rounded-md object-contain border border-white/10"
                                        key={image.publicUrl}
                                        src={image.publicUrl}
                                        alt=""
                                        width={2000}
                                        height={2000}
                                    />
                                ))}

                                {pathname.includes("dashboard") && eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 && (
                                    images?.length ?? 0) > 0 && (
                                        <div className="flex items-start gap-4">
                                            <DeleteEventPictureDialog images={images} />

                                            <UpdateEventHeroImageDialog eventId={eventId} />
                                        </div>
                                    )}

                                {pathname.includes("dashboard") && eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 && images?.length === 0 && (
                                    <UpdateEventHeroImageDialog eventId={eventId} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))
            }

            {pathname.includes("dashboard") && (
                <div className="flex gap-4">
                    <Link className="tracking-wider text-white/70 active:underline"
                        href={`/dashboard/event-page/${eventId}`}>
                        About
                    </Link>
                    <Link className="tracking-wider text-white/70 active:underline"
                        href={`/dashboard/event-photos/${eventId}`}>
                        Photos
                    </Link>
                </div>
            ) || (
                    <div className="flex gap-4">
                        <Link className="tracking-wider text-white/70 active:underline"
                            href={`/event-page/${eventId}`}>
                            About
                        </Link>
                        <Link className="tracking-wider text-white/70 active:underline"
                            href={`/event-photos/${eventId}`}>
                            Photos
                        </Link>
                    </div>
                )}
        </div>
    )
}