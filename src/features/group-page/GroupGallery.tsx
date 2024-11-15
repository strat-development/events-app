"use client"

import { ImageCarousel } from "@/components/dashboard/ImageCarouel"
import { DeleteGroupAlbumDialog } from "@/components/dashboard/modals/DeleteGroupAlbumDialog";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { Pagination } from "@mui/material";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
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
            <div className="grid grid-cols-3 w-full gap-[120px] justify-between">
                {currentItems.map((album) => (
                    <div key={album.id}>
                        <Link href={window.location.pathname.includes('dashboard') ? `/dashboard/group-photos-album/${groupId}?albumId=${album.id}` : `/group-photos-album/${groupId}?albumId=${album.id}`}>
                            <ImageCarousel imageUrls={album.publicUrls.map((image: any) => image.publicUrl)} />
                            <p>{album.album_name}</p>
                        </Link>
                        {window.location.pathname.includes("/dashboard") && ownerId === userId && (
                            <DeleteGroupAlbumDialog albumId={album.id} />
                        )}
                    </div>
                ))}
                <Pagination
                    className="self-center"
                    count={pageCount}
                    page={currentPage}
                    onChange={handlePageChange}
                    variant="outlined"
                    color="secondary"
                />
            </div>
        </>
    );
}