"use client"

import { AlbumsImageCarousel } from "@/components/dashboard/AlbumsImageCarousel";
import { DeleteEventAlbumDialog } from "@/components/dashboard/modals/events/DeleteEventAlbumDialog";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination"
import { ImageIcon } from "lucide-react";
import "@/styles/calendar-icon.css"

interface EventGalleryProps {
    eventId: string;
}

export const EventGallery = ({ eventId }: EventGalleryProps) => {
    const supabase = createClientComponentClient<Database>();

    const [albums, setAlbums] = useState<any[]>([]);
    const { eventCreatorId } = useGroupOwnerContext();
    const { userId } = useUserContext();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const pathname = usePathname();

    const { data: albumsData, error: albumsError } = useQuery(
        ['picture-albums', eventId],
        async () => {
            const { data, error } = await supabase
                .from('event-picture-albums')
                .select('*')
                .eq('event_id', eventId);
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
        if (albumsError) {
            console.error('Error fetching albums:', albumsError);
            return;
        }

        if (albumsData && albumsData.length > 0) {
            const fetchPublicUrls = async (imageUrls: string) => {
                const imageUrlsArray = JSON.parse(imageUrls);
                const publicUrls = await Promise.all(imageUrlsArray.map(async (imagePath: string) => {
                    const { data: publicURL } = await supabase.storage
                        .from('event-albums')
                        .getPublicUrl(imagePath);

                    return { publicUrl: publicURL.publicUrl };
                }));

                return publicUrls.filter(url => url !== null);
            };

            const fetchAllAlbums = async () => {
                const albumsWithUrls = await Promise.all(albumsData.map(async (album: any) => {
                    const publicUrls = await fetchPublicUrls(album.image_urls);
                    return { ...album, publicUrls };
                }));

                setAlbums(albumsWithUrls);
            };

            fetchAllAlbums().catch(console.error);
        }
    }, [albumsData, albumsError]);

    const memoizedAlbums = useMemo(() => albums, [albums]);

    const totalItems = memoizedAlbums.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = memoizedAlbums.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    return (
        <>
            <div className="flex flex-col max-w-[1200px] w-full gap-8 justify-center mb-24">
                <div className="max-w-[1200px] w-full flex flex-wrap justify-center gap-8 min-[768px]:justify-evenly min-[768px]:gap-24">
                    {currentItems.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-4 w-full h-[70vh]">
                            <div className="metallic-icon-container">
                                <div className="metallic-icon-container">
                                    <svg className="metallic-gradient">
                                        <defs>
                                            <linearGradient id="metallic-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#ffffff" stopOpacity=".5" />
                                                <stop offset="25%" stopColor="#a0a0a0" stopOpacity="0.7" />
                                                <stop offset="50%" stopColor="#d3d3d3" stopOpacity="0.8" />
                                                <stop offset="75%" stopColor="#a0a0a0" stopOpacity="0.9" />
                                                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.7" />
                                            </linearGradient>
                                        </defs>
                                    </svg>

                                    <div className="metallic-icon">
                                        <ImageIcon />
                                    </div>
                                </div>
                                <div className="gradient-overlay" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <p className="text-center text-xl text-white/60 font-medium">No albums found for this event</p>
                                <p className="text-center text-lg text-white/50">Wait for the event creator to create an album</p>
                            </div>
                        </div>
                    ) || (
                            currentItems.map((album) => (
                                <div className="flex flex-col relative gap-2 max-w-[280px] text-center items-center"
                                    key={album.id}>
                                    <AlbumsImageCarousel imageCount={album.publicUrls.length ?? 0}
                                        eventId={eventId} album={album}
                                        imageUrls={album.publicUrls.map((image: any) => image.publicUrl)} />
                                    <p className="text-lg">{album.album_name}</p>

                                    {pathname.includes("/dashboard") && eventCreatorId === userId && (
                                        <DeleteEventAlbumDialog albumId={album.id} />
                                    )}
                                </div>
                            )))}
                </div>

                {currentItems.length > 0 && (
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
        </>
    );
}