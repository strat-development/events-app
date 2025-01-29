"use client"

import { EventHero } from "@/features/custom-event-page/EventHero";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { Pagination } from "@mui/material";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Key, useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";

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
        if (!loading && !userId) {
            router.push('/');
        }
    }, [loading, userId, router]);

    const { data: albumsData, error: albumsError } = useQuery(
        ['event-picture-albums', eventId],
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

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = memoizedAlbums.slice(startIndex, endIndex);
    const pageCount = Math.ceil(memoizedAlbums.length / itemsPerPage);

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
    };

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
                                                className="max-w-[280px] aspect-square w-full border border-white/10 rounded-md"
                                                height={1920}
                                                width={1080}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <Pagination
                            className="self-center"
                            count={pageCount}
                            page={currentPage}
                            onChange={handlePageChange}
                            variant="outlined"
                            sx={{
                                '& .MuiPaginationItem-root': {
                                    color: 'white',
                                    backgroundColor: 'rgba(255, 255, 255, 0)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    },
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                },
                                '& .Mui-selected': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1) !important',
                                    color: 'white',
                                },
                            }}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}