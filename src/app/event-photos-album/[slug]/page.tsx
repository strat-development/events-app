"use client"

import { UpdateEventImagesAlbumDialog } from "@/components/dashboard/modals/UpdateEventImagesDialog";
import { Button } from "@/components/ui/button";
import { EventHero } from "@/features/custom-event-page/EventHero";
import { supabaseAdmin } from "@/lib/admin";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { Pagination } from "@mui/material";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { Key, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

export default function EventPhotosAlbumPage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const eventId = params.slug;
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();
    const [albums, setAlbums] = useState<any[]>([]);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const { userId } = useUserContext();
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    if (!userId) {
        router.push('/');
        return null
    }

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

        if (albumsData && albumsData.length > 0) {
            const queryParams = new URLSearchParams(window.location.search);
            const albumId = queryParams.get('albumId');

            if (albumId) {
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
        }
    }, [albumsData, albumsError]);

    const deleteImagesMutation = useMutation(
        async (imageUrls: string[]) => {
            const extractRelativePath = (url: string) => {
                const urlParts = url.split('/storage/v1/object/public/event-albums/');
                return urlParts.length > 1 ? urlParts[1] : url;
            };

            const relativePaths = imageUrls.map(extractRelativePath);

            const deletePromises = relativePaths.map(async (relativePath) => {
                const { error } = await supabaseAdmin.storage
                    .from('event-albums')
                    .remove([relativePath]);
                if (error) {
                    throw error;
                }
            });

            await Promise.all(deletePromises);

            const { data: albumsData, error: fetchError } = await supabase
                .from('event-picture-albums')
                .select('id, image_urls')
                .in('id', albums.map(album => album.id));

            if (fetchError) {
                throw fetchError;
            }

            const updatePromises = albumsData.map(async (album: any) => {
                const currentImageUrls = JSON.parse(album.image_urls);
                const newImageUrls = currentImageUrls.filter((url: string) => !relativePaths.includes(url));

                const { error: updateError } = await supabase
                    .from('event-picture-albums')
                    .update({ image_urls: JSON.stringify(newImageUrls) })
                    .eq('id', album.id);

                if (updateError) {
                    throw updateError;
                }
            });

            await Promise.all(updatePromises);

            queryClient.invalidateQueries(['event-albums', eventId]);
        }
    );

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
            <div className="h-screen flex flex-col items-center justify-center">
                <h1 className="text-3xl font-bold">Event Photos Album</h1>
                <EventHero eventId={eventId} />
                <div className="flex flex-col gap-8 items-center">
                    <UpdateEventImagesAlbumDialog />
                    <div className="grid grid-cols-3 gap-3">
                        {currentItems.map((album, index) => (
                            <div key={index}>
                                <h2 className="text-xl font-bold">{album.name}</h2>
                                <div className="grid grid-cols-3 gap-8">
                                    {album.publicUrls.map((imageUrl: { publicUrl: string | undefined; }, index: Key | null | undefined) => (
                                        <div key={index} className={`relative ${imageUrl.publicUrl && selectedImages.includes(imageUrl.publicUrl) ? 'outline outline-4 outline-blue-500' : ''}`}>
                                            <img src={imageUrl.publicUrl} alt={`Image ${index}`} className="w-full h-auto" />
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
                <Button onClick={() => {
                    deleteImagesMutation.mutate(Array.from(selectedImages));
                    setSelectedImages([]);
                }
                }
                    disabled={selectedImages.length === 0}>
                    Delete Selected Images
                </Button>
            </div>
        </>
    );
}