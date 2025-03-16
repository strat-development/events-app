"use client"

import { EventSidebar } from "@/components/EventSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Database } from "@/types/supabase"
import { EventData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format, parseISO } from "date-fns"
import { Ticket } from "lucide-react"
import Image from "next/image"
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
    const [selectedEventImageUrl, setSelectedEventImageUrl] = useState<string | null>(null);

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
                        <div onClick={() => {
                            setIsSidebarOpen(true);
                            setSelectedEvent(event);
                            setSelectedEventImageUrl(memoizedImageUrls[event.id]);
                        }}
                            key={event.id}
                            className="flex flex-col cursor-pointer w-full gap-8">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-xl font-semibold text-white/70 tracking-wider">{format(parseISO(event.starts_at as string), 'yyyy-MM-dd')}</h2>
                                <hr />
                            </div>
                            <div className="flex gap-4 border border-white/10 p-4 rounded-xl h-[240px]">
                                <div className="flex flex-col items-center justify-center gap-4 border rounded-xl border-white/10 aspect-square">
                                    {memoizedImageUrls[event.id] && (
                                        <Image
                                            src={memoizedImageUrls[event.id]}
                                            alt=""
                                            width={200}
                                            height={200}
                                            objectFit="cover"
                                        />
                                    ) || (
                                            <div className="w-full h-full flex items-center justify-center bg-white/10 rounded-xl">
                                                <p className="text-center font-medium">No image available 😔</p>
                                            </div>
                                        )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h1 className="text-2xl font-bold tracking-wider line-clamp-2 text-white/70">{event.event_title}</h1>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex gap-1">
                                            <p className="text-lg text-white/50 font-medium">{format(parseISO(event.starts_at as string), 'yyyy-MM-dd HH:mm')} - {format(parseISO(event.ends_at as string), 'HH:mm')}</p>
                                        </div>

                                        <p className="text-white/60">{event.event_address}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Ticket size={20} />
                                            {event?.ticket_price !== null && event.ticket_price > 10000 ? (
                                                <p className="text-sm text-white/60 font-bold">FREE</p>
                                            ) : (
                                                <p className="text-sm text-white/60">{event?.ticket_price}$</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <SidebarProvider>
                {isSidebarOpen && <EventSidebar imageUrl={selectedEventImageUrl}
                    selectedEvent={selectedEvent}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)} />}
            </SidebarProvider>
        </>
    )
}