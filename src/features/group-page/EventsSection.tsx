"use client"

import { Button } from "@/components/ui/button"
import { Database } from "@/types/supabase"
import { EventData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format, parseISO } from "date-fns"
import { Ticket } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useQuery } from "react-query"

interface EventsSectionProps {
    groupId: string
}

export const EventsSection = ({ groupId }: EventsSectionProps) => {
    const supabase = createClientComponentClient<Database>()
    const [groupEvents, setGroupEvents] = useState<{ [date: string]: EventData[] }>({});
    const eventIds = Object.values(groupEvents).flat().map((event) => event.id);
    const [imageUrls, setImageUrls] = useState<{ [eventId: string]: string }>({});
    const router = useRouter();
    const pathname = usePathname();

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

        if (data) {
            setGroupEvents((prev) => ({
                ...prev,
                [groupId]: data
            }))
        }

        return data
    },
        {
            cacheTime: 10 * 60 * 1000,
        })

    const { data: images, isLoading } = useQuery(
        ['event-pictures', eventIds],
        async () => {
            const { data, error } = await supabase
                .from('event-pictures')
                .select('*')
                .in('event_id', eventIds);
            if (error) {
                throw error;
            }
            return data || [];
        },
        {
            enabled: !!eventIds,
            cacheTime: 10 * 60 * 1000,
        }
    );

    useEffect(() => {
        if (images) {
            Promise.all(images.map(async (image) => {
                const { data: publicURL } = await supabase.storage
                    .from('event-pictures')
                    .getPublicUrl(image.hero_picture_url || "");

                return { eventId: image.event_id, publicUrl: publicURL.publicUrl };
            }))
                .then((publicUrls) => {
                    const urlMapping: { [eventId: string]: string } = {};
                    publicUrls.forEach(({ eventId, publicUrl }) => {
                        urlMapping[eventId] = publicUrl;
                    });
                    setImageUrls(urlMapping);
                })
                .catch(console.error);
        }
    }, [images]);


    const memoizedEvents = useMemo(() => events.data, [events.data])
    const memoizedImageUrls = useMemo(() => imageUrls, [imageUrls])

    return (
        <>
            {events.isLoading && <p>Loading...</p>}

            {events.isSuccess && (
                <div className='flex flex-col gap-4 mt-8 w-full'>
                    <h2 className='text-2xl tracking-wider font-bold'>Upcoming events</h2>
                    {memoizedEvents?.map((event: EventData) => (
                        <div key={event.id} className="flex flex-col w-full gap-8">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-xl font-semibold text-white/70 tracking-wider">{format(parseISO(event.starts_at as string), 'yyyy-MM-dd')}</h2>
                                <hr />
                            </div>
                            <div className="flex gap-4 border border-white/10 p-4 rounded-md h-[240px]">
                                <div className="flex flex-col items-center justify-center gap-4 border rounded-md border-white/10 aspect-square">
                                    {memoizedImageUrls[event.id] && (
                                        <Image
                                            src={memoizedImageUrls[event.id]}
                                            alt=""
                                            width={200}
                                            height={200}
                                            objectFit="cover"
                                        />
                                    ) || (
                                            <div className="w-full h-full flex items-center justify-center bg-white/10 rounded-md">
                                                <p className="text-center font-medium">No image available 😔</p>
                                            </div>
                                        )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h1 className="text-2xl font-bold tracking-wider line-clamp-2">{event.event_title}</h1>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-lg text-white/70">{format(parseISO(event.starts_at as string), 'yyyy-MM-dd HH:mm')}</p>
                                        <p className="text-white/60">{event.event_address}</p>
                                        <div className="flex gap-2 mt-1">
                                            <Ticket className="h-6 w-6" />
                                            <p className="font-bold tracking-wide text-white/70">{event.ticket_price}</p>
                                        </div>
                                    </div>
                                    {pathname.includes("dashboard") && (
                                        <div className="flex gap-4">
                                            <Button onClick={() => router.push(`/dashboard/event-page/${event.id}`)}>
                                                View event
                                            </Button>
                                        </div>
                                    ) || (
                                            <div className="flex gap-4">
                                                <Button onClick={() => router.push(`/event-page/${event.id}`)}>
                                                    View event
                                                </Button>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    )
}