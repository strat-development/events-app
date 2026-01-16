"use client"

import { AlbumsImageCarousel } from "@/components/dashboard/AlbumsImageCarousel";
import { DeleteGroupAlbumDialog } from "@/components/dashboard/modals/groups/DeleteGroupAlbumDialog";
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
import { ImageLightbox } from "@/components/dashboard/ImageLightbox";

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
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);

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

    const totalItems = memoizedAlbums.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = memoizedAlbums.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleCarouselImageClick = (imageUrls: string[], index: number) => {
        setLightboxImages(imageUrls);
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    return (
        <div className="flex flex-col w-full gap-8 mb-24">
            {currentItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-6 w-full h-[50vh]">
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
                            <ImageIcon size={48} />
                        </div>
                        <div className="gradient-overlay" />
                    </div>
                    <div className="flex flex-col gap-2 text-center">
                        <p className="text-xl text-white/70 font-medium">No albums yet</p>
                        <p className="text-white/50">
                            {pathname.includes("/dashboard") 
                                ? "Create your first album to get started" 
                                : "Check back later for group photos"}
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {currentItems.map((album) => (
                            <div 
                                className="flex flex-col gap-4 group" 
                                key={album.id}
                            >
                                <AlbumsImageCarousel 
                                    imageCount={album.publicUrls.length}
                                    groupId={groupId}
                                    album={album}
                                    imageUrls={album.publicUrls.map((image: any) => image.publicUrl)}
                                    onImageClick={handleCarouselImageClick}
                                />
                                
                                <div className="flex flex-col gap-2 px-2">
                                    <h3 className="text-lg font-semibold truncate" title={album.album_name}>
                                        {album.album_name}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-white/60">
                                            {album.publicUrls.length} {album.publicUrls.length === 1 ? 'photo' : 'photos'}
                                        </p>
                                        {pathname.includes("/dashboard") && ownerId === userId && (
                                            <DeleteGroupAlbumDialog albumId={album.id} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <Pagination className="mt-4">
                            <PaginationContent className="flex gap-2">
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={currentPage === 1 ? undefined : () => handlePageChange(currentPage - 1)}
                                        aria-disabled={currentPage === 1}
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
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </>
            )}

            <ImageLightbox
                images={lightboxImages}
                initialIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />
        </div>
    );
}