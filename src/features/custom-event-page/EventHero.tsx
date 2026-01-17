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
import { usePathname, useRouter } from "next/navigation"
import { Edit, Save } from "lucide-react"
import { useViewContext } from "@/providers/pageViewProvider"

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
    const groupId = eventData?.map((event) => event.event_group).toString()   
    const [eventNameToEdit, setEventNameToEdit] = useState(false)
    const [newEventName, setNewEventName] = useState("")
    const [imageUrls, setImageUrls] = useState<{ publicUrl: string }[]>([]);
    const [groupImageUrls, setGroupImageUrls] = useState<{ publicUrl: string }[]>([]);
    const { setView } = useViewContext()
    const isEventAlbum = pathname.includes("event-photos-album")
    const router = useRouter()

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

    const { data: images } = useQuery(
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
        <>
            <div className="flex flex-col gap-6 w-full">
                {memoizedEventData?.map((event) => (
                    <div key={event.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
                        <div className="flex flex-col gap-4">
                            {!eventNameToEdit ? (
                                <div className="flex items-start gap-3">
                                    <h1 className="text-3xl font-bold tracking-wider bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                                        {event.event_title}
                                    </h1>
                                    {pathname.includes("dashboard") && eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 && (
                                        <Button 
                                            className="text-white/70 hover:text-white transition-colors"
                                            variant="ghost"
                                            onClick={() => setEventNameToEdit(true)}
                                        >
                                            <Edit size={18} />
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="New event name"
                                        value={newEventName}
                                        onChange={(e) => setNewEventName(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button 
                                        variant="ghost"
                                        onClick={() => setEventNameToEdit(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        variant="ghost"
                                        className="text-blue-500 hover:text-blue-400"
                                        onClick={() => {
                                            editEventNameMutation.mutateAsync(newEventName)
                                            setEventNameToEdit(false)
                                        }}
                                    >
                                        <Save size={18} />
                                    </Button>
                                </div>
                            )}

                            <div className="flex flex-col gap-3 lg:hidden">
                                <div>
                                    <p className="text-base text-white/70">
                                        {format(parseISO(event.starts_at as string), 'MMM dd, yyyy HH:mm')} - {format(parseISO(event.ends_at as string), 'HH:mm')}
                                    </p>
                                    <p className="text-white/60 mt-1">{event.event_address}</p>
                                </div>
                                <EventReportDialog eventId={eventId} />
                            </div>

                            <Link className="lg:hidden" href={`/group-page/${groupId}`}>
                                <div className='flex gap-3 items-start transition-all'>
                                    {memoizedGroupImages?.map((image) => (
                                        <div key={image.publicUrl} className="flex-shrink-0">
                                            <Image 
                                                className="w-12 h-12 rounded-lg object-cover ring-2 ring-white/10"
                                                src={image.publicUrl}
                                                alt=""
                                                width={200}
                                                height={200}
                                            />
                                        </div>
                                    ))}
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <h3 className="text-base font-semibold tracking-wide truncate">{memoizedGroupInfo.data?.[0].group_name}</h3>
                                        <p className="text-sm text-white/70 truncate">{memoizedGroupInfo.data?.[0].group_country}, {memoizedGroupInfo.data?.[0].group_city}</p>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        <div className="mt-6">
                            <div className="flex flex-col gap-4">
                                {memoizedImageUrls.map((image) => (
                                    <div key={image.publicUrl} className="relative group overflow-hidden rounded-xl">
                                        <Image 
                                            className="w-full aspect-video rounded-xl object-cover ring-2 ring-white/10 transition-all duration-300 group-hover:ring-white/30"
                                            src={image.publicUrl}
                                            alt=""
                                            width={2000}
                                            height={2000}
                                        />
                                    </div>
                                ))}

                                {pathname.includes("dashboard") && eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 && (
                                    <div className="flex gap-3">
                                        {(images?.length ?? 0) > 0 ? (
                                            <>
                                                <DeleteEventPictureDialog images={images} />
                                                <UpdateEventHeroImageDialog eventId={eventId} />
                                            </>
                                        ) : (
                                            <UpdateEventHeroImageDialog eventId={eventId} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                
                <div className="sticky top-20 z-10 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-xl">
                    <div className="flex gap-2">
                        {isEventAlbum ? (
                            <>
                                <Button 
                                    variant="ghost"
                                    className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 font-medium"
                                    onClick={() => router.push(`/event-page/${eventId}`)}
                                >
                                    About
                                </Button>
                                <Button 
                                    variant="ghost"
                                    className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 font-medium"
                                    onClick={() => router.push(`/event-page/${eventId}`)}
                                >
                                    Photos
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button 
                                    variant="ghost"
                                    className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 font-medium"
                                    onClick={() => setView("about")}
                                >
                                    About
                                </Button>
                                <Button 
                                    variant="ghost"
                                    className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 font-medium"
                                    onClick={() => setView("photos")}
                                >
                                    Photos
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}