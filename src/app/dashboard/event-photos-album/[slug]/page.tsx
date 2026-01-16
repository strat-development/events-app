"use client"

import { UpdateEventImagesAlbumDialog } from "@/components/dashboard/modals/events/UpdateEventImagesDialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { EventHero } from "@/features/custom-event-page/EventHero";
import { supabaseAdmin } from "@/lib/admin";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Trash, ImageIcon, Check } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Key, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination"
import GridLoader from "react-spinners/GridLoader";
import { ImageLightbox } from "@/components/dashboard/ImageLightbox";
import { twMerge } from "tailwind-merge";

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
    const { userId, loading } = useUserContext();
    const { eventCreatorId } = useGroupOwnerContext();
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 24;
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const albumId = searchParams.get('albumId');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

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
        if (!loading && userId === null && eventCreatorId === null) {
            router.push('/');
        }
    }, [loading, userId, router, eventCreatorId]);

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
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['event-picture-albums', eventId]);
                toast({
                    title: 'Images deleted',
                })
            }
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

    const handleImageClick = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const handleSelectAll = () => {
        if (albums.length > 0 && albums[0].publicUrls) {
            const allImageUrls = albums[0].publicUrls.map((img: { publicUrl: string }) => img.publicUrl);
            setSelectedImages(allImageUrls);
        }
    };

    const handleDeselectAll = () => {
        setSelectedImages([]);
    };

    const allImages = useMemo(() => {
        if (albums.length > 0 && albums[0].publicUrls) {
            return albums[0].publicUrls.map((img: { publicUrl: string }) => img.publicUrl);
        }
        return [];
    }, [albums]);

    const totalItems = allImages.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentImages = allImages.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <GridLoader className="opacity-50" color="#fff" size={24} margin={2} />
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-12 items-center max-w-[1400px] w-full justify-self-center px-4 md:px-6">
                {eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 && (
                    <div className="min-h-screen mt-24 flex flex-col gap-10 items-center w-full">
                        <EventHero eventId={eventId} />

                        {albums.length > 0 && albums[0] && (
                            <>
                                <div className="w-full flex flex-col gap-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex flex-col gap-2">
                                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                                                {albums[0].album_name}
                                            </h1>
                                            <p className="text-white/60 flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4" />
                                                {allImages.length} {allImages.length === 1 ? 'photo' : 'photos'}
                                            </p>
                                        </div>

                                        {pathname.includes("/dashboard") && eventCreatorId === userId && (
                                            <div className="flex flex-wrap items-center gap-3">
                                                {selectedImages.length > 0 ? (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            onClick={handleDeselectAll}
                                                            className="border-white/20 hover:bg-white/10"
                                                        >
                                                            Deselect All
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                            onClick={() => {
                                                                deleteImagesMutation.mutate(Array.from(selectedImages));
                                                                setSelectedImages([]);
                                                            }}
                                                            disabled={deleteImagesMutation.isLoading}
                                                        >
                                                            <Trash className="w-4 h-4 mr-2" />
                                                            Delete ({selectedImages.length})
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        onClick={handleSelectAll}
                                                        className="border-white/20 hover:bg-white/10"
                                                    >
                                                        Select All
                                                    </Button>
                                                )}
                                                <UpdateEventImagesAlbumDialog />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="w-full">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
                                        {currentImages.map((imageUrl: string, index: number) => (
                                            <div
                                                key={index}
                                                className={twMerge(
                                                    "relative group aspect-square overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer",
                                                    selectedImages.includes(imageUrl)
                                                        ? "border-blue-500 border-2 ring-2 ring-blue-500/50"
                                                        : "border-white/20 hover:border-white/40"
                                                )}
                                            >
                                                <div
                                                    onClick={() => handleImageClick(startIndex + index)}
                                                    className="relative w-full h-full"
                                                >
                                                    <Image
                                                        src={imageUrl}
                                                        alt={`Image ${startIndex + index + 1}`}
                                                        fill
                                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
                                                    />

                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                </div>

                                                {pathname.includes("/dashboard") && eventCreatorId === userId && (
                                                    <div
                                                        className="absolute top-2 right-2 z-10"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            onClick={() => handleCheckboxChange(imageUrl)}
                                                            className={twMerge(
                                                                "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200",
                                                                selectedImages.includes(imageUrl)
                                                                    ? "bg-blue-500 border-blue-500"
                                                                    : "bg-black/40 border-white/40 backdrop-blur-sm hover:bg-black/60"
                                                            )}
                                                        >
                                                            {selectedImages.includes(imageUrl) && (
                                                                <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {totalPages > 1 && (
                                    <Pagination className="mt-8">
                                        <PaginationContent className="flex gap-2">
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={currentPage === 1 ? undefined : () => handlePageChange(currentPage - 1)}
                                                    aria-disabled={currentPage === 1}
                                                    className={twMerge(
                                                        currentPage === 1 && "opacity-50 cursor-not-allowed"
                                                    )}
                                                />
                                            </PaginationItem>
                                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                                let page;
                                                if (totalPages <= 7) {
                                                    page = i + 1;
                                                } else if (currentPage <= 4) {
                                                    page = i + 1;
                                                } else if (currentPage >= totalPages - 3) {
                                                    page = totalPages - 6 + i;
                                                } else {
                                                    page = currentPage - 3 + i;
                                                }
                                                return (
                                                    <PaginationItem key={page}>
                                                        <PaginationLink
                                                            isActive={page === currentPage}
                                                            onClick={() => handlePageChange(page)}
                                                        >
                                                            {page}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                );
                                            })}
                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={currentPage === totalPages ? undefined : () => handlePageChange(currentPage + 1)}
                                                    aria-disabled={currentPage === totalPages}
                                                    className={twMerge(
                                                        currentPage === totalPages && "opacity-50 cursor-not-allowed"
                                                    )}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
                
            <ImageLightbox
                images={allImages}
                initialIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />
        </>
    );
}