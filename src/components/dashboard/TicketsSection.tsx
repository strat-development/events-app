"use state"

import { useUserContext } from "@/providers/UserContextProvider"
import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useQuery } from "react-query"
import { Button } from "../ui/button"
import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Globe, Ticket } from "lucide-react"
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation"
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination"
import { TicketsData } from "@/types/types"
import { TicketDialog } from "./modals/events/TicketDialog"


export const Ticketsection = () => {
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
        <div className="flex flex-col gap-4">
            <div className="flex gap-4">
                <Button className={activeTickets === true ? "border-b-[1px] border-white/70 text-white/70 rounded-none hover:bg-transparent" : "text-white/50 hover:bg-transparent"}
                    variant="ghost"
                    onClick={() => {
                        setActiveTickets(true);
                        fetchTickets.refetch();
                    }}>
                    Active
                </Button>
                <Button className={activeTickets === false ? "border-b-[1px] border-white/70 text-white/70 rounded-none hover:bg-transparent" : "text-white/50 hover:bg-transparent"}
                    variant="ghost"
                    onClick={() => {
                        setActiveTickets(false);
                        fetchTickets.refetch();
                    }}>
                    Expired
                </Button>
            </div>

            <div className="flex flex-wrap max-[800px]:justify-center gap-8">
                {activeTickets && (
                    <>
                        {activeTickets && currentActiveItems.length === 0 && (
                            <div className="flex flex-col justify-self-center items-center w-full gap-8 mt-24">
                                <h2 className="text-white/70 text-center text-2xl font-semibold tracking-wide">You have no tickets for events</h2>
                                <Button
                                    className="flex flex-col items-center max-w-[280px] w-full p-4 justify-center rounded-xl bg-transparent hover:bg-white/5 transition-all duration-300"
                                    onClick={() => router.push('/home')}
                                    variant="ghost">
                                    <div className="flex flex-col items-center gap-8">
                                        <div className="text-6xl text-white/70">
                                            <Globe size={128}
                                                strokeWidth={1} />
                                        </div>
                                        <p className="text-xl tracking-wide text-white/50 font-medium">Discover Events</p>
                                    </div>
                                </Button>
                            </div>
                        )}

                        {currentActiveItems?.map((ticket) => (
                            <div key={ticket?.id} className="flex flex-col gap-2 w-[280px] h-[440px]  border rounded-xl border-white/10 p-4">
                                <div className="flex items-center justify-center border rounded-xl border-white/10 w-full aspect-square">
                                    {ticket?.id && ticket.event_id && memoizedImageUrls[ticket.event_id] ? (
                                        <Image
                                            src={memoizedImageUrls[ticket.event_id]}
                                            alt={ticket.event_title || ""}
                                            width={200}
                                            height={200}
                                            className="object-cover rounded-xl w-full max-h-[240px]"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-xl">
                                            <p className="text-center font-medium">No image available 😔</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h1 className="text-lg font-bold tracking-wider line-clamp-2">{ticket.event_title}</h1>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm text-white/70">{format(parseISO(ticket.event_starts_at as string), 'yyyy-MM-dd HH:mm')}</p>
                                        <p className="text-sm text-white/60">{ticket.event_address}</p>
                                        <div className="flex gap-2 mt-1 items-center">
                                            <Ticket className="h-4 w-4" />
                                            {ticket?.ticket_price === "FREE" ? (
                                                <p className="text-sm text-white/60 font-bold tracking-wide">FREE</p>
                                            ) : (
                                                <p className="text-sm text-white/60 font-bold tracking-wide">{ticket.ticket_price}$</p>
                                            )}
                                        </div>
                                    </div>
                                    <TicketDialog ticketsData={activeTicketData}
                                        isTicketExpired={false} />
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            <div className="flex flex-wrap max-[800px]:justify-center gap-8">
                {!activeTickets && (
                    currentExpiredItems?.map((ticket) => (
                        <div key={ticket?.id} className="flex flex-col gap-2 w-[280px] h-[440px]  border rounded-xl border-white/10 p-4">
                            <div className="flex items-center justify-center border rounded-xl border-white/10 w-full aspect-square">
                                {ticket?.id && ticket.event_id && memoizedImageUrls[ticket.event_id] ? (
                                    <Image
                                        src={memoizedImageUrls[ticket.event_id]}
                                        alt={ticket.event_title || ""}
                                        width={200}
                                        height={200}
                                        className="object-cover rounded-xl w-full max-h-[240px]"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-xl">
                                        <p className="text-center font-medium">No image available 😔</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                <h1 className="text-lg font-bold tracking-wider line-clamp-2">{ticket.event_title}</h1>
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-white/70">{format(parseISO(ticket.event_starts_at as string), 'yyyy-MM-dd HH:mm')}</p>
                                    <p className="text-sm text-white/60">{ticket.event_address}</p>
                                    <div className="flex gap-2 mt-1 items-center">
                                        <Ticket className="h-4 w-4" />
                                        {ticket?.ticket_price === "FREE" ? (
                                            <p className="text-sm text-white/60 font-bold tracking-wide">FREE</p>
                                        ) : (
                                            <p className="text-sm text-white/60 font-bold tracking-wide">{ticket.ticket_price}$</p>
                                        )}
                                    </div>
                                </div>
                                <TicketDialog ticketsData={expiredTicketData}
                                    isTicketExpired={true} />
                            </div>
                        </div>
                    )))
                }
            </div>

            {
                (activeTickets && currentActiveItems.length > 0) || (!activeTickets && currentExpiredItems.length > 0) ? (
                    <Pagination>
                        <PaginationContent className="flex gap-8">
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
                ) : null
            }
        </div >
    )
}