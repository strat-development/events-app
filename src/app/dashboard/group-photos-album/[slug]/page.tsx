"use client"

import { UpdateGroupImagesAlbumDialog } from "@/components/dashboard/modals/UpdateGroupImagesDialog";
import { Button } from "@/components/ui/button";
import { GroupHero } from "@/features/group-page/GroupHero";
import { supabaseAdmin } from "@/lib/admin";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Key, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

export default function GroupPhotosAlbumPage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const groupId = params.slug;
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();
    const [albums, setAlbums] = useState<any[]>([]);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const { userId } = useUserContext();
    const { ownerId } = useGroupOwnerContext()
    const router = useRouter();

    if (!ownerId || !userId) {
        router.push('/');
        return null
    }

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
            const queryParams = new URLSearchParams(window.location.search);
            const albumId = queryParams.get('albumId');

            if (albumId) {
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
                const urlParts = url.split('/storage/v1/object/public/group-albums-pictures/');
                return urlParts.length > 1 ? urlParts[1] : url;
            };

            const relativePaths = imageUrls.map(extractRelativePath);

            const deletePromises = relativePaths.map(async (relativePath) => {
                const { error } = await supabaseAdmin.storage
                    .from('group-albums-pictures')
                    .remove([relativePath]);
                if (error) {
                    throw error;
                }
            });

            await Promise.all(deletePromises);

            const { data: albumsData, error: fetchError } = await supabase
                .from('group-picture-albums')
                .select('id, image_urls')
                .in('id', albums.map(album => album.id));

            if (fetchError) {
                throw fetchError;
            }

            const updatePromises = albumsData.map(async (album: any) => {
                const currentImageUrls = JSON.parse(album.image_urls);
                const newImageUrls = currentImageUrls.filter((url: string) => !relativePaths.includes(url));

                const { error: updateError } = await supabase
                    .from('group-picture-albums')
                    .update({ image_urls: JSON.stringify(newImageUrls) })
                    .eq('id', album.id);

                if (updateError) {
                    throw updateError;
                }
            });

            await Promise.all(updatePromises);

            queryClient.invalidateQueries(['group-albums-pictures', groupId]);
        }
    );

    const handleCheckboxChange = (imageUrl: string) => {
        setSelectedImages(prevSelectedImages => {
            const newSelectedImages = new Set(prevSelectedImages);
            if (newSelectedImages.has(imageUrl)) {
                newSelectedImages.delete(imageUrl);
            } else {
                newSelectedImages.add(imageUrl);
            }
            return Array.from(newSelectedImages);
        });
    };

    const memoizedAlbums = useMemo(() => albums, [albums]);

    return (
        <>
        {ownerId === userId && ownerId.length > 0 && userId.length > 0 && (
            <div className="h-screen flex flex-col items-center justify-center w-full">
                <h1 className="text-3xl font-bold">Group Photos Album</h1>
                <GroupHero groupId={groupId} />
                <div className="flex flex-col gap-8 items-center justify-center">
                    {window.location.pathname.includes("/dashboard") && ownerId === userId && (
                        <UpdateGroupImagesAlbumDialog />
                    )}
                    <div className="grid grid-cols-3 gap-8 items-center">
                        {memoizedAlbums.map((album, index) => (
                            <div key={index}>
                                <h2 className="text-xl font-bold">{album.name}</h2>
                                <div className="grid grid-cols-3 gap-8">
                                    {album.publicUrls.map((imageUrl: { publicUrl: string | undefined; }, index: Key | null | undefined) => (
                                        <div key={index} className={`relative ${imageUrl.publicUrl && selectedImages.includes(imageUrl.publicUrl) ? 'outline outline-4 outline-blue-500' : ''}`}>
                                            <Image src={imageUrl.publicUrl || ""}
                                                alt={`Image ${index}`}
                                                width={2000}
                                                height={2000} />
                                            <input
                                                type="checkbox"
                                                className="absolute top-2 right-2"
                                                checked={selectedImages.includes(imageUrl.publicUrl ?? '')}
                                                onChange={() => handleCheckboxChange(imageUrl.publicUrl ?? '')}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {window.location.pathname.includes("/dashboard") && ownerId === userId && (
                    <Button onClick={() => {
                        deleteImagesMutation.mutate(Array.from(selectedImages));
                        setSelectedImages([]);
                    }
                    }
                        disabled={selectedImages.length === 0}>
                        Delete Selected Images
                    </Button>
                )}
            </div>
        )}
    </>
    );
}