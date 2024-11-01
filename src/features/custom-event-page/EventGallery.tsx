"use client"

import { ImageCarousel } from "@/components/dashboard/ImageCarouel"
import { DeleteEventAlbumDialog } from "@/components/dashboard/modals/DeleteEventAlbumDialog";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "react-query";

interface EventGalleryProps {
    eventId: string;
}

export const EventGallery = ({ eventId }: EventGalleryProps) => {
    const supabase = createClientComponentClient<Database>();

    const [albums, setAlbums] = useState<any[]>([]);
    const {eventCreatorId} = useGroupOwnerContext();
    const {userId} = useUserContext();

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

    return (
        <>
            <div className="grid grid-cols-3 w-full gap-[120px] justify-between">
                {albums.map((album) => (
                    <div key={album.id}>
                        <Link href={window.location.pathname.includes('dashboard') ? `/dashboard/event-photos-album/${eventId}?albumId=${album.id}` : `/event-photos-album/${eventId}?albumId=${album.id}`}>
                            <ImageCarousel imageUrls={album.publicUrls.map((image: any) => image.publicUrl)} />
                            <p>{album.album_name}</p>
                        </Link>

                        {window.location.pathname.includes("/dashboard") && eventCreatorId === userId && (
                            <DeleteEventAlbumDialog albumId={album.id} />
                        )}

                    </div>
                ))}
            </div>
        </>
    );
}