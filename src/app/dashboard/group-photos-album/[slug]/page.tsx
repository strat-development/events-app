"use client"

import { UpdateGroupImagesAlbumDialog } from "@/components/dashboard/modals/groups/UpdateGroupImagesDialog";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { GroupHero } from "@/features/group-page/GroupHero";
import { supabaseAdmin } from "@/lib/admin";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Trash } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Key, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination";
import GridLoader from "react-spinners/GridLoader";

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
    const { userId, loading } = useUserContext();
    const { ownerId } = useGroupOwnerContext();
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const albumId = searchParams.get('albumId');

    const { data: albumsData, error: albumsError } = useQuery(
        ['picture-albums', groupId],
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
        if (!loading && userId === null && ownerId === null) {
            router.push('/');
        }
    }, [loading, userId, router, ownerId]);

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
    }, [albumsData, albumsError, albumId, supabase.storage]);

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

    const totalItems = memoizedAlbums.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = memoizedAlbums.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <GridLoader className="opacity-50" color="#fff" size={24} margin={2} />
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-8 items-center max-w-[1200px] w-full justify-self-center">
                {ownerId === userId && ownerId.length > 0 && userId.length > 0 && (
                    <div className="min-h-screen mt-24 flex flex-col gap-8 items-center justify-center w-full">
                        <GroupHero groupId={groupId} />
                        <div className="flex flex-col gap-8 w-full">
                            {pathname.includes("/dashboard") && ownerId === userId && (
                                <div className="flex gap-4 justify-self-end justify-end">
                                    {selectedImages.length > 0 && (
                                        <Button className="max-[900px]:hidden"
                                            variant="ghost"
                                            onClick={() => {
                                                deleteImagesMutation.mutate(Array.from(selectedImages));
                                                setSelectedImages([]);
                                            }}
                                            disabled={selectedImages.length === 0}>
                                            <Trash size={20} className="text-red-500" />
                                        </Button>
                                    )}
                                    <UpdateGroupImagesAlbumDialog />
                                </div>
                            )}

                            <div className="w-full flex flex-wrap justify-center gap-8 min-[768px]:justify-between min-[768px]:gap-24">
                                {currentItems.map((album, index) => (
                                    <div key={index}
                                        className="flex flex-col gap-4">
                                        <h2 className="text-xl font-bold tracking-wider">{album.name}</h2>
                                        <div className="w-full flex flex-wrap justify-center gap-8 min-[768px]:justify-evenly min-[768px]:gap-24">
                                            {album.publicUrls.map((imageUrl: { publicUrl: string | undefined; }, index: Key | null | undefined) => (
                                                <div key={index} className={`relative ${imageUrl.publicUrl && selectedImages.includes(imageUrl.publicUrl) ? 'outline outline-2 outline-blue-500 rounded-md' : ''}`}>
                                                    <Image src={imageUrl.publicUrl ?? ''}
                                                        alt={`Image ${index}`}
                                                        className="max-w-[280px] aspect-square w-full border border-white/10 rounded-md"
                                                        height={1920}
                                                        width={1080}
                                                    />
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
                    </div>
                )}

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

            <Toaster />
        </>
    );
}