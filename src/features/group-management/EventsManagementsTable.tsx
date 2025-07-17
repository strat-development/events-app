"use client"

import { UserReportDialog } from "@/components/dashboard/modals/contact/ReportUserDialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { supabaseAdmin } from "@/lib/admin"
import { useUserContext } from "@/providers/UserContextProvider"
import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { IconDotsVertical, IconGhost2Filled } from "@tabler/icons-react"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useQuery } from "react-query"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationNext,
    PaginationLink
} from "@/components/ui/pagination"
import Link from "next/link"

interface EventsManagementTableProps {
    searchQuery: string | null
}

export const EventsManagementTable = ({ searchQuery }: EventsManagementTableProps) => {
    const supabase = createClientComponentClient<Database>()
    const [attendeesId, setAttendeesId] = useState<string[]>()
    const [profileImageUrls, setProfileImageUrls] = useState<{ user_id: string; publicUrl: string }[]>([]);
    const { userId } = useUserContext();
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const eventData = useQuery(
        ['event-data'],
        async () => {
            const { data, error } = await supabase
                .from("events")
                .select(`id, event_title`)
                .eq("created_by", userId)

            if (error) {
                throw new Error(error.message)
            }

            return data
        },
        {
            enabled: !!userId,
            cacheTime: 10 * 60 * 1000,
            staleTime: 10 * 60 * 1000,
            keepPreviousData: true,
        }
    )

    const eventIds = eventData.data?.map(event => event.id)

    const eventAttendees = useQuery(
        ['event-attendees-data'],
        async () => {
            const { data, error } = await supabaseAdmin
                .from("event-attendees")
                .select(`users (*), event_id`)
                .in("event_id", eventIds || [])

            if (error) {
                throw new Error(error.message)
            }

            if (data) {
                setAttendeesId(data.map((member) => member.users?.id as string))
            }
            return data
        },
        {
            enabled: !!eventIds && eventIds.length > 0,
            cacheTime: 10 * 60 * 1000,
            staleTime: 10 * 60 * 1000,
            keepPreviousData: true,
        })

    const { data: profileImages } = useQuery(
        ['profile-pictures', attendeesId],
        async () => {
            const { data, error } = await supabase
                .from('profile-pictures')
                .select('*')
                .in('user_id', attendeesId || [])
            if (error) {
                throw error;
            }
            return data || [];
        },
        {
            enabled: !!attendeesId,
            cacheTime: 10 * 60 * 1000,
            staleTime: 10 * 60 * 1000,
            keepPreviousData: true,
        }
    );

    useEffect(() => {
        if (profileImages) {
            Promise.all(profileImages.map(async (image) => {
                const { data: publicURL } = await supabase.storage
                    .from('profile-pictures')
                    .getPublicUrl(image.image_url)

                return { user_id: image.user_id, publicUrl: publicURL.publicUrl };
            }))
                .then((publicUrls) => setProfileImageUrls(publicUrls.filter(url => url.user_id !== null) as { user_id: string; publicUrl: string }[]))
                .catch(console.error);
        }
    }, [profileImages]);

    const combinedData = useMemo(() => {
        if (!eventAttendees.data || !eventData.data) return [];

        return eventAttendees.data.map((member) => {
            const event = eventData.data.find((event) => event.id === member.event_id);
            const profileImageUrl = profileImageUrls.find((url) => url.user_id === member.users?.id)?.publicUrl;

            return {
                userName: member.users?.full_name || "Unknown User",
                eventName: event?.event_title || "Unknown Event",
                profileImageUrl: profileImageUrl,
                userId: member.users?.id,
            };
        });
    }, [eventAttendees.data, eventData.data, profileImageUrls]);

    const filteredData = useMemo(() => {
        return combinedData.filter((item) =>
            item.userName.toLowerCase().includes((searchQuery ?? "").toLowerCase())
        );
    }, [combinedData, searchQuery]);

    const totalItems = filteredData.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedData = filteredData.slice(startIndex, endIndex)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    if (eventData.isLoading || eventAttendees.isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col gap-8 w-full">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Profile Image</TableHead>
                        <TableHead>User Name</TableHead>
                        <TableHead>Event Name</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedData.map((item, index) => (
                        <TableRow className="text-white/70"
                            key={index}>
                            <TableCell>
                                <Link href={`/user-profile/${item.userId}`}>
                                    {item.profileImageUrl && (
                                        <Image
                                            src={item.profileImageUrl}
                                            alt="Profile"
                                            className="w-10 h-10 rounded-full"
                                            width={48}
                                            height={48}
                                        />
                                    ) || (
                                            <div className="flex h-[50px] w-[50px] flex-col gap-2 items-center justify-center rounded-full bg-white/5">
                                                <IconGhost2Filled className="w-6 h-6 text-white/70"
                                                    strokeWidth={1} />
                                            </div>
                                        )}
                                </Link>
                            </TableCell>
                            <TableCell className="font-medium">
                                <Link href={`/user-profile/${item.userId}`}>
                                    {item.userName}
                                </Link>
                            </TableCell>
                            <TableCell>{item.eventName}</TableCell>
                            <TableCell>
                                <Popover>
                                    <PopoverTrigger>
                                        <div className="flex items-center gap-2 cursor-pointer text-white/50">
                                            <IconDotsVertical size={20} className="text-white/70" />
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-fit">
                                        <div className="flex flex-col">
                                            <UserReportDialog userId={item.userId || ""} />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {totalPages > 1 && (
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
            )}
        </div>
    )
}