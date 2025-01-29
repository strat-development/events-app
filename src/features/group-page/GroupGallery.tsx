"use client"

import { AlbumsImageCarousel } from "@/components/dashboard/AlbumsImageCarousel";
import { DeleteGroupAlbumDialog } from "@/components/dashboard/modals/groups/DeleteGroupAlbumDialog";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { Pagination } from "@mui/material";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";

interface GroupGalleryProps {
    groupId: string;
}

export const GroupGallery = ({ groupId }: GroupGalleryProps) => {
    const supabase = createClientComponentClient<Database>();
    const { userId } = useUserContext();
    const { ownerId } = useGroupOwnerContext();
    const [albums, setAlbums] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const pathname = usePathname();

    const { data: albumsData, error: albumsError } = useQuery(
        ['group-picture-albums', groupId],
        async () => {
            const { data, error } = await supabase
                .from('group-picture-albums')
                .select('*')
                .eq('group_id', groupId);
            if (error) {
                throw error;
            }
            return data || [];
        },
        {
            enabled: !!groupId,
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
                        .from('group-albums-pictures')
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

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = memoizedAlbums.slice(startIndex, endIndex);
    const pageCount = Math.ceil(memoizedAlbums.length / itemsPerPage);

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
    };

    return (
        <>
            <div className="flex flex-col w-full gap-8 justify-center mb-24">
                <div className="w-full flex flex-wrap justify-center gap-8 min-[768px]:justify-evenly min-[768px]:gap-24">
                    {currentItems.map((album) => (
                        <div className="flex flex-col relative gap-2 max-w-[280px] text-center items-center"
                            key={album.id}>
                            <AlbumsImageCarousel groupId={groupId} album={album}
                                imageUrls={album.publicUrls.map((image: any) => image.publicUrl)} />

                            <p className="text-lg justify-self-center">{album.album_name}</p>

                            {pathname.includes("/dashboard") && ownerId === userId && (
                                <DeleteGroupAlbumDialog albumId={album.id} />
                            )}
                        </div>
                    ))}
                </div>
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
        </>
    );
}