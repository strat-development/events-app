import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { CreatePostDialog } from "../../components/dashboard/modals/posts/CreatePostDialog"
import { Database } from "@/types/supabase";
import { useQuery } from "react-query";
import { useEffect, useRef, useState } from "react";
import { PostGallery } from "./PostGallery";
import { format, parseISO } from "date-fns";
import { DeletePostDialog } from "../../components/dashboard/modals/posts/DeletePostDialog";
import { PostReportDialog } from "@/components/dashboard/modals/contact/PostReportDialog";
import { AddComment } from "./AddComment";
import { PostsData, UserData } from "@/types/types";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { IconDotsVertical } from "@tabler/icons-react";
import { ReportCommentDialog } from "@/components/dashboard/modals/contact/ReportCommentDialog";
import { DeleteCommentDialog } from "@/components/dashboard/modals/posts/DeleteCommentDialog";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import _ from 'lodash';
import { PostViewModal } from "../group-page/PostViewModal";
import { UserProfileSidebar } from "@/components/UserProfileSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

interface UserPostsSectionProps {
    userId: string;
}

export const UserPostsSection = ({ userId }: UserPostsSectionProps) => {
    const supabase = createClientComponentClient<Database>();
    const [posts, setPosts] = useState<PostsData[]>([]);
    const [profileImageUrls, setProfileImageUrls] = useState<{ userId: string, publicUrl: string }[]>([]);
    const [commentId, setCommentId] = useState<string[]>([]);
    const pathname = usePathname();
    const prevCommentedUserId = useRef();
    const [isOpen, setIsOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [selectedUserImageUrl, setSelectedUserImageUrl] = useState<string | null>(null);

    const fetchPostData = useQuery(
        'posts',
        async () => {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', userId)

            if (error) {
                console.error('Error fetching posts:', error);
                throw new Error(error.message);
            }

            setPosts(data);
            return data;
        },
        {
            cacheTime: 10 * 60 * 1000,
        }
    );

    const { data } = useQuery(
        'comments',
        async () => {
            const { data, error } = await supabase
                .from('post-comments')
                .select('*')
                .eq('post_id', posts.map((post) => post.id));

            if (error) {
                console.error('Error fetching comments:', error);
                throw new Error(error.message);
            }

            setCommentId(data.map((comment) => comment.id));

            return data;
        },
        {
            cacheTime: 10 * 60 * 1000,
            enabled: fetchPostData.isSuccess,
        }
    );

    const commentedUser = useQuery(
        'user',
        async () => {
            const { data, error } = await supabase
                .from("post-comments")
                .select(`users (*)`)
                .in('id', commentId || []);

            if (error) {
                console.error('Error fetching user:', error);
                throw new Error(error.message);
            }

            return data;
        },
        {
            enabled: Array.isArray(commentId) && commentId.length > 0,
        }
    );

    const commentedUserId = commentedUser.data?.map((user) => user.users?.id).filter(id => id !== undefined);

    useEffect(() => {
        if (!_.isEqual(prevCommentedUserId.current, commentedUserId)) {
            prevCommentedUserId.current = commentedUserId as any;

            if (commentedUserId && commentedUserId.length > 0) {
                const fetchProfileImages = async () => {
                    const { data, error } = await supabase
                        .from('profile-pictures')
                        .select('user_id, image_url')
                        .in('user_id', commentedUserId);

                    if (error) {
                        console.error("Error fetching profile images:", error);
                        return;
                    }

                    const urlMap: Record<string, string> = {};
                    await Promise.all(
                        data.map(async (image) => {
                            if (image.image_url) {
                                const { data: publicURL } = await supabase.storage
                                    .from('profile-pictures')
                                    .getPublicUrl(image.image_url);
                                if (publicURL && image.user_id) {
                                    urlMap[image.user_id] = publicURL.publicUrl;
                                }
                            }
                        })
                    );

                    setProfileImageUrls(Object.entries(urlMap).map(([userId, url]) => ({ userId, publicUrl: url })));
                };

                fetchProfileImages();
            }
        }
    }, [commentedUserId, profileImageUrls]);

    return (
        <>
            <div className="flex flex-col gap-6 w-full">
                {pathname.includes('/dashboard') && (
                    <div className="flex justify-end">
                        <CreatePostDialog />
                    </div>
                )}

                {posts.length === 0 ? (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 shadow-xl">
                        <p className="text-center text-white/50">No posts yet</p>
                    </div>
                ) : (
                    posts.map((post) => {
                        const commentCount = data?.filter((comment) => comment.post_id === post.id).length || 0;

                        return (
                            <div key={post.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                                <PostGallery postId={post.id} />
                                    
                                <div className="flex justify-between gap-4 items-start mt-4">
                                    <h2 className="text-2xl font-bold tracking-wider text-white">{post.post_title}</h2>
                                    <div>
                                        {pathname.includes('/dashboard') && userId === post.user_id ? (
                                            <DeletePostDialog postId={post.id} />
                                        ) : (
                                            <PostReportDialog postId={post.id} />
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 mt-4">
                                    <div className="prose prose-invert max-w-none text-white/80"
                                        dangerouslySetInnerHTML={{ __html: post.post_content as string }}
                                    />
                                    <p className="text-white/50 text-sm">{format(parseISO(post.created_at as string), 'MMM dd, yyyy')}</p>
                                </div>

                                <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-white/10">
                                    {data?.filter((comment) => comment.post_id === post.id).slice(0, 3).map((comment) => (
                                        <div 
                                            key={comment.id}
                                            className="flex justify-between items-start gap-4 bg-white/5 p-4 rounded-xl"
                                        >
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div 
                                                    className="cursor-pointer flex-shrink-0"
                                                    onClick={() => {
                                                        setIsSidebarOpen(true);
                                                        setIsOpen(true);
                                                        setSelectedUser(commentedUser.data?.find((user) => user.users?.id === comment.user_id)?.users || null);
                                                        setSelectedUserImageUrl(profileImageUrls.find((url) => url.userId === comment.user_id)?.publicUrl || null);
                                                    }}
                                                >
                                                    <Image
                                                        src={profileImageUrls.find((url) => url.userId === comment.user_id)?.publicUrl || "/default-avatar.png"}
                                                        width={40}
                                                        height={40}
                                                        alt=""
                                                        className="rounded-full ring-2 ring-white/10 hover:ring-white/30 transition-all"
                                                        priority 
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                                    <div className="flex gap-2 items-center">
                                                        <p className="text-white font-medium">
                                                            {commentedUser.data?.find((user) => user.users?.id === comment.user_id)?.users?.full_name}
                                                        </p>
                                                        <p className="text-white/50 text-xs">
                                                            {format(parseISO(comment.created_at as string), 'MMM dd')}
                                                        </p>
                                                    </div>
                                                    <p className="text-white/70 break-words">{comment.comment_content}</p>
                                                </div>
                                            </div>
                                            <Popover>
                                                <PopoverTrigger>
                                                    <div className="flex items-center gap-2 cursor-pointer text-white/50 hover:text-white/70 transition-colors">
                                                        <IconDotsVertical size={20} />
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-fit">
                                                    <div className="flex flex-col">
                                                        <ReportCommentDialog commentId={comment.id} />
                                                        {userId === comment.user_id && (
                                                            <DeleteCommentDialog commentId={comment.id} />
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    ))}

                                    {commentCount > 3 && (
                                        <div className="mt-2">
                                            <PostViewModal 
                                                selectedUser={selectedUser}
                                                post={post as any}
                                                comments={data || [] as any}
                                                profileImageUrls={profileImageUrls}
                                                commentedUser={commentedUser.data || [] as any}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/10">
                                    <AddComment postId={post.id} />
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <SidebarProvider>
                {isSidebarOpen && (
                    <UserProfileSidebar isOpen={isOpen}
                        onClose={() => setIsSidebarOpen(false)}
                        selectedUser={selectedUser}
                        imageUrl={selectedUserImageUrl} />
                )}
            </SidebarProvider>
        </>
    )
}