"use client"

import { EventHero } from "@/features/custom-event-page/EventHero";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Key, useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination"
import GridLoader from "react-spinners/GridLoader";

export default function EventPhotosAlbumPage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const eventId = params.slug;
    const supabase = createClientComponentClient<Database>();
    const [albums, setAlbums] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const { userId, loading } = useUserContext();
    const router = useRouter();
    const searchParams = useSearchParams();
    const albumId = searchParams.get('albumId');

    useEffect(() => {
        if (!loading && userId === null) {
            router.push('/');
        }
    }, [loading, userId, router]);

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

        if (albumsData && albumsData.length > 0 && albumId) {
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

            const fetchAlbumImages = async () => {
                const album = albumsData.find((album: any) => album.id === albumId);
                if (album) {
                    const publicUrls = await fetchPublicUrls(String(album.image_urls ?? '[]'));
                    const albumWithUrls = { ...album, publicUrls };

                    setAlbums([albumWithUrls]);
                } else {
                    console.error('Album not found');
                }
            };

            fetchAlbumImages();
        }
    }, [albumsData, albumsError, supabase.storage]);

    const memoizedAlbums = useMemo(() => albums, [albums]);

    const totalItems = memoizedAlbums.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = memoizedAlbums.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <GridLoader className="opacity-50" color="#fff" size={24} margin={2} />
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-col gap-8 items-center max-w-[1200px] w-full justify-self-center">
                <div className="min-h-screen mt-24 flex flex-col gap-8 items-center justify-center w-full">
                    <EventHero eventId={eventId} />
                    <div className="flex flex-col gap-8 w-full">
                        {currentItems.map((album, index) => (
                            <div key={index}>
                                <h2 className="text-xl tracking-wider font-bold">{album.name}</h2>
                                <div className="w-full flex flex-wrap justify-center gap-8 min-[768px]:justify-evenly min-[768px]:gap-24">
                                    {album.publicUrls.map((imageUrl: { publicUrl: string | undefined; }, index: Key | null | undefined) => (
                                        <div key={index}>
                                            <Image
                                                src={imageUrl.publicUrl || ""}
                                                alt={`Image ${index}`}
                                                className="max-w-[280px] aspect-square w-full border border-white/10 rounded-xl"
                                                height={1920}
                                                width={1080}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

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
                    </div>
                </div>
            </div>
        </>
    );
}