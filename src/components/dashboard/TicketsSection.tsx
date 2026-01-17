"use client"

import { useUserContext } from "@/providers/UserContextProvider"
import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useQuery } from "react-query"
import { Button } from "../ui/button"
import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Globe, Ticket, MapPin, Calendar, Sparkles } from "lucide-react"
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation"
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination"
import { TicketsData } from "@/types/types"
import { TicketDialog } from "./modals/events/TicketDialog"
import { twMerge } from "tailwind-merge"


export const TicketsSection = () => {
    const supabase = createClientComponentClient<Database>()
    const { userId } = useUserContext();
    const [activeTickets, setActiveTickets] = useState(true)
    const [imageUrls, setImageUrls] = useState<{ [eventId: string]: string }>({});
    const [activeTicketData, setActiveTicketData] = useState<TicketsData[]>([]);
    const [expiredTicketData, setExpiredTicketData] = useState<TicketsData[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const today = new Date();
    const itemsPerPage = 20;
    const router = useRouter();

    const fetchTickets = useQuery(
        ['tickets', userId],
        async () => {
            const { data: activeData, error: activeError } = await supabase
                .from('event-tickets')
                .select('*')
                .gte('event_starts_at', today.toISOString())
                .eq('user_id', userId);

            const { data: expiredData, error: expiredError } = await supabase
                .from('event-tickets')
                .select('*')
                .lt('event_starts_at', today.toISOString())
                .eq('user_id', userId);

            if (activeError || expiredError) {
                console.error("Error fetching tickets:", activeError?.message || expiredError?.message);
                throw new Error(activeError?.message || expiredError?.message);
            }

            if (activeData) {
                setActiveTicketData(activeData);
            }

            if (expiredData) {
                setExpiredTicketData(expiredData);
            }

            return { activeData, expiredData };
        },
        {
            enabled: !!userId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    const eventIds = fetchTickets ? [...activeTicketData.map(ticket => ticket.event_id), ...expiredTicketData.map(ticket => ticket.event_id)] : [];

    const { data: images } = useQuery(
        ['event-pictures', eventIds],
        async () => {
            if (eventIds.length === 0) return [];

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
            enabled: eventIds.length > 0,
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

    const memoizedTickets = useMemo(() => activeTicketData, [activeTicketData]);
    const memoizedExpiredTickets = useMemo(() => expiredTicketData, [expiredTicketData]);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const memoizedImageUrls = useMemo(() => imageUrls, [imageUrls]);
    const currentActiveItems = memoizedTickets?.slice(startIndex, endIndex) ?? [];
    const currentExpiredItems = memoizedExpiredTickets?.slice(startIndex, endIndex) ?? [];
    const totalPages = Math.ceil((activeTickets ? (memoizedTickets?.length ?? 0) : (memoizedExpiredTickets?.length ?? 0)) / itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
                        My Tickets
                    </h1>
                    <div className="flex gap-2">
                        <Button 
                            className={twMerge(
                                "px-6 py-2 rounded-xl font-medium transition-all duration-300",
                                activeTickets === true 
                                    ? "bg-white/20 border-white/30 text-white" 
                                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80"
                            )}
                            variant="outline"
                            onClick={() => {
                                setActiveTickets(true);
                                fetchTickets.refetch();
                            }}>
                            Active
                        </Button>
                        <Button 
                            className={twMerge(
                                "px-6 py-2 rounded-xl font-medium transition-all duration-300",
                                activeTickets === false 
                                    ? "bg-white/20 border-white/30 text-white" 
                                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80"
                            )}
                            variant="outline"
                            onClick={() => {
                                setActiveTickets(false);
                                fetchTickets.refetch();
                            }}>
                            Expired
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-6">
                {activeTickets && (
                    <>
                        {activeTickets && currentActiveItems.length === 0 && (
                            <div className="col-span-full">
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 shadow-xl">
                                    <div className="flex flex-col items-center gap-6 text-center">
                                        <div className="w-24 h-24 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                                            <Ticket className="w-12 h-12 text-white/40" strokeWidth={1.5} />
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-2xl font-bold text-white/80">No Active Tickets</h2>
                                            <p className="text-white/50">You don't have any tickets for upcoming events</p>
                                        </div>
                                        <Button
                                            className="mt-4 bg-white/10 hover:bg-white/20 border-white/20 text-white font-medium px-8"
                                            onClick={() => router.push('/home')}
                                            variant="outline">
                                            <Globe className="w-4 h-4 mr-2" />
                                            Discover Events
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentActiveItems?.map((ticket) => (
                            <div
                                key={ticket?.id}
                                className="group relative flex flex-col w-[280px] h-[360px] rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
                            >
                                <div className="relative flex flex-col h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:border-white/20 transition-all duration-300">
                                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-full">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                        <span className="text-xs font-semibold text-green-300 tracking-wide">ACTIVE</span>
                                    </div>

                                    <div className="relative w-full h-40 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 z-10" />
                                        {ticket?.id && ticket.event_id && memoizedImageUrls[ticket.event_id] ? (
                                            <Image
                                                src={memoizedImageUrls[ticket.event_id]}
                                                alt={ticket.event_title || ""}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800/50 to-slate-900/50">
                                                <Sparkles className="w-12 h-12 text-white/20" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative flex flex-col flex-1 p-4 gap-3">
                                        <h1 className="text-base font-bold tracking-wide line-clamp-2 text-white/90 group-hover:text-white transition-colors">
                                            {ticket.event_title}
                                        </h1>

                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3 text-white/70">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/10 group-hover:bg-white/15 transition-colors">
                                                    <Calendar className="w-4 h-4 text-white/70" strokeWidth={1.5} />
                                                </div>
                                                <span className="text-sm font-medium">
                                                    {format(parseISO(ticket.event_starts_at as string), 'MMM dd, yyyy • HH:mm')}
                                                </span>
                                            </div>

                                            <div className="flex items-start gap-3 text-white/70">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/10 shrink-0 group-hover:bg-white/15 transition-colors">
                                                    <MapPin className="w-4 h-4 text-white/70" strokeWidth={1.5} />
                                                </div>
                                                <span className="text-sm font-medium line-clamp-2">
                                                    {ticket.event_address}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/10 group-hover:bg-white/15 transition-colors">
                                                    <Ticket className="w-4 h-4 text-white/70" strokeWidth={1.5} />
                                                </div>
                                                {ticket?.ticket_price === "FREE" ? (
                                                    <span className="text-lg font-bold tracking-wider text-green-400">
                                                        FREE
                                                    </span>
                                                ) : (
                                                    <span className="text-lg font-bold tracking-wider text-white/90">
                                                        ${ticket.ticket_price}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-2">
                                            <TicketDialog ticketsData={activeTicketData} isTicketExpired={false} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            <div className="flex flex-wrap gap-6">
                {!activeTickets && (
                    <>
                        {currentExpiredItems.length === 0 && (
                            <div className="col-span-full">
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 shadow-xl">
                                    <div className="flex flex-col items-center gap-6 text-center">
                                        <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                            <Ticket className="w-12 h-12 text-white/30" strokeWidth={1.5} />
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-2xl font-bold text-white/80">No Expired Tickets</h2>
                                            <p className="text-white/50">You don't have any expired tickets</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {currentExpiredItems?.map((ticket) => (
                            <div
                                key={ticket?.id}
                                className="group relative flex flex-col w-[280px] h-[360px] rounded-2xl overflow-hidden transition-all duration-300 opacity-60 hover:opacity-80"
                            >
                                <div className="relative flex flex-col h-full bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-full">
                                        <div className="w-2 h-2 bg-red-400 rounded-full" />
                                        <span className="text-xs font-semibold text-red-300 tracking-wide">EXPIRED</span>
                                    </div>

                                    <div className="relative w-full h-40 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 z-10" />
                                        {ticket?.id && ticket.event_id && memoizedImageUrls[ticket.event_id] ? (
                                            <Image
                                                src={memoizedImageUrls[ticket.event_id]}
                                                alt={ticket.event_title || ""}
                                                fill
                                                className="object-cover grayscale"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800/30 to-slate-900/30">
                                                <Sparkles className="w-12 h-12 text-white/10" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative flex flex-col flex-1 p-4 gap-3">
                                        <h1 className="text-lg font-bold tracking-wide line-clamp-2 text-white/50">
                                            {ticket.event_title}
                                        </h1>

                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-3 text-white/40">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/5">
                                                    <Calendar className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                                                </div>
                                                <span className="text-sm font-medium">
                                                    {format(parseISO(ticket.event_starts_at as string), 'MMM dd, yyyy • HH:mm')}
                                                </span>
                                            </div>

                                            <div className="flex items-start gap-3 text-white/40">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/5 shrink-0">
                                                    <MapPin className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                                                </div>
                                                <span className="text-sm font-medium line-clamp-2">
                                                    {ticket.event_address}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/5">
                                                    <Ticket className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                                                </div>
                                                {ticket?.ticket_price === "FREE" ? (
                                                    <span className="text-lg font-bold tracking-wider text-white/40">
                                                        FREE
                                                    </span>
                                                ) : (
                                                    <span className="text-lg font-bold tracking-wider text-white/40">
                                                        ${ticket.ticket_price}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-2">
                                            <TicketDialog ticketsData={expiredTicketData} isTicketExpired={true} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
                    
            {(activeTickets && currentActiveItems.length > 0) || (!activeTickets && currentExpiredItems.length > 0) ? (
                <Pagination>
                    <PaginationContent className="flex gap-2">
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={currentPage === 1 ? undefined : () => handlePageChange(currentPage - 1)}
                                aria-disabled={currentPage === 1}
                            />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    isActive={page === currentPage}
                                    onClick={() => handlePageChange(page)}
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                onClick={currentPage === totalPages ? undefined : () => handlePageChange(currentPage + 1)}
                                aria-disabled={currentPage === totalPages}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            ) : null}
        </div>
    )
}