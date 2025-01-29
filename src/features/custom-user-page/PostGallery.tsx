"use client";

import { PostsImageCarousel } from "@/components/dashboard/PostsImageCarousel";
import { supabaseAdmin } from "@/lib/admin";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";

interface PostGalleryProps {
    postId: string;
}

export const PostGallery = ({ postId }: PostGalleryProps) => {
    const supabase = createClientComponentClient<Database>();
    const [posts, setPosts] = useState<any[]>([]);

    const { data: postsData, error: postsError } = useQuery(
        ['post-images', postId],
        async () => {
            const { data, error } = await supabase
                .from('post-pictures')
                .select('*')
                .eq('post_id', postId);

            if (error) {
                console.error('Error fetching post images:', error);
                throw new Error(error.message);
            }

            return data;
        },
        {
            enabled: !!postId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    useEffect(() => {
        if (postsError) {
            console.error('Error fetching posts:', postsError);
            return;
        }

        if (postsData && postsData.length > 0) {
            const fetchPublicUrls = async (imageUrls: string) => {
                const imageUrlsArray = JSON.parse(imageUrls);
                const publicUrls = await Promise.all(imageUrlsArray.map(async (imagePath: string) => {
                    const { data: publicURL } = await supabase.storage
                        .from('posts-pictures')
                        .getPublicUrl(imagePath);

                    return { publicUrl: publicURL.publicUrl };
                }))

                return publicUrls.filter((url) => url.publicUrl !== null);
            }

            const fetchAllPosts = async () => {
                const postsWithImages = await Promise.all(postsData.map(async (post: any) => {
                    const publicUrls = await fetchPublicUrls(post.image_urls);
                    return { ...post, imageUrls: publicUrls };
                }))

                setPosts(postsWithImages);  
            }

            fetchAllPosts().catch(console.error);
        }
    }, [postsData, postsError]);



    const memoizedImages = useMemo(() => posts, [posts]);

    return (
        <div className="max-w-[1200px] w-full flex flex-wrap justify-center gap-8 min-[768px]:justify-evenly min-[768px]:gap-24">
            {memoizedImages?.map((post) => (
                <div
                    className="flex flex-col relative gap-4 text-center items-center"
                    key={post.id}>
                    <PostsImageCarousel
                        imageCount={post.imageUrls.length ?? 0}
                        imageUrls={post.imageUrls.map((image: any) => image.publicUrl)}
                    />
                </div>
            ))}
        </div>
    );
};
