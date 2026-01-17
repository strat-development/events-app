"use client"

import { EventSidebar } from "@/components/EventSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Database } from "@/types/supabase"
import { EventData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format, parseISO } from "date-fns"
import { Ticket } from "lucide-react"
import Image from "next/image"
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

    const { data: images } = useQuery(
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
            {events.isLoading && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <p className="text-white/70 text-center">Loading events...</p>
                </div>
            )}

            {events.isSuccess && (
                <div className='bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl'>
                    <h2 className='text-2xl tracking-wider font-bold mb-6 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent'>
                        Upcoming events
                    </h2>
                    
                    <div className="flex flex-col gap-6">
                        {memoizedEvents?.map((event: EventData) => (
                            <div 
                                key={event.id}
                                onClick={() => {
                                    setIsSidebarOpen(true);
                                    setSelectedEvent(event);
                                    setSelectedEventImageUrl(memoizedImageUrls[event.id]);
                                }}
                                className="group cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg"
                            >
                                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
                                    <div className="bg-blue-500/20 px-3 py-1 rounded-lg">
                                        <h3 className="text-sm font-semibold text-blue-400">
                                            {format(parseISO(event.starts_at as string), 'MMM dd, yyyy')}
                                        </h3>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 overflow-hidden rounded-xl ring-2 ring-white/10 group-hover:ring-white/30 transition-all">
                                        {memoizedImageUrls[event.id] ? (
                                            <Image
                                                src={memoizedImageUrls[event.id]}
                                                alt=""
                                                width={200}
                                                height={200}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                <p className="text-center text-xs text-white/50 px-2">No image</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                                        <h1 className="text-xl font-bold tracking-wider line-clamp-2 text-white/90 group-hover:text-white transition-colors">
                                            {event.event_title}
                                        </h1>
                                        
                                        <div className="flex flex-col gap-2 text-sm">
                                            <p className="text-white/70">
                                                {format(parseISO(event.starts_at as string), 'HH:mm')} - {format(parseISO(event.ends_at as string), 'HH:mm')}
                                            </p>
                                            
                                            <p className="text-white/60 line-clamp-1">{event.event_address}</p>
                                            
                                            <div className="flex items-center gap-2 mt-1 bg-white/5 w-fit px-3 py-1 rounded-lg">
                                                <Ticket size={16} className="text-white/70" />
                                                {event?.ticket_price === "FREE" ? (
                                                    <p className="text-sm text-green-400 font-bold">FREE</p>
                                                ) : (
                                                    <p className="text-sm text-white/70 font-medium">${event?.ticket_price}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
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