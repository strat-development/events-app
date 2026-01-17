import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { useQuery } from "react-query";
import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { PostReportDialog } from "@/components/dashboard/modals/contact/PostReportDialog";
import { GroupPostsData, UserData } from "@/types/types";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { IconDotsVertical } from "@tabler/icons-react";
import { ReportCommentDialog } from "@/components/dashboard/modals/contact/ReportCommentDialog";
import { DeleteCommentDialog } from "@/components/dashboard/modals/posts/DeleteCommentDialog";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { CreateGroupPostDialog } from "@/components/dashboard/modals/posts/CreateGroupPostDialog";
import { GroupPostsGallery } from "./GroupPostsGallery";
import { DeleteGroupPostsDialog } from "@/components/dashboard/modals/groups/DeleteGroupPostsDialog";
import { AddGroupComment } from "./AddGroupComment";
import _ from 'lodash';
import { PostViewModal } from "./PostViewModal";
import { useUserContext } from "@/providers/UserContextProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserProfileSidebar } from "@/components/UserProfileSidebar";
import { BookImage, ImagePlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import "@/styles/calendar-icon.css"

interface GroupPostsSectionProps {
    groupId: string;
}

export const GroupPostsSection = ({ groupId }: GroupPostsSectionProps) => {
    const supabase = createClientComponentClient<Database>();
    const [posts, setPosts] = useState<GroupPostsData[]>([]);
    const [profileImageUrls, setProfileImageUrls] = useState<{ userId: string; publicUrl: string }[]>([]);
    const [commentId, setCommentId] = useState<string[]>([]);
    const pathname = usePathname();
    const prevCommentedGroupId = useRef();
    const { userId } = useUserContext()
    const [isOpen, setIsOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [selectedUserImageUrl, setSelectedUserImageUrl] = useState<string | null>(null);
    const router = useRouter();

    const fetchPostData = useQuery(
        'posts',
        async () => {
            const { data, error } = await supabase
                .from('group-posts')
                .select('*')
                .eq('group_id', groupId)

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
                .from('group-posts-comments')
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
                .from("group-posts-comments")
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

    const commentedGroupId = commentedUser.data?.map((user) => user.users?.id).filter(id => id !== undefined);

    useEffect(() => {
        if (!_.isEqual(prevCommentedGroupId.current, commentedGroupId)) {
            prevCommentedGroupId.current = commentedGroupId as any;

            if (commentedGroupId && commentedGroupId.length > 0) {
                const fetchProfileImages = async () => {
                    const { data, error } = await supabase
                        .from('profile-pictures')
                        .select('user_id, image_url')
                        .in('user_id', commentedGroupId as any);

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

                    const newUrls = Object.entries(urlMap).map(([userId, url]) => ({ userId, publicUrl: url }));

                    setProfileImageUrls(newUrls);
                };

                fetchProfileImages();
            }
        }
    }, [commentedGroupId, profileImageUrls]);

    return (
        <>
            <div className="flex flex-col gap-6 w-full">
                {pathname.includes('/dashboard') && (
                    <div className="flex justify-end">
                        <CreateGroupPostDialog groupId={groupId} />
                    </div>
                )}

                {posts.length === 0 ? (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 shadow-xl">
                        <div className="flex flex-col items-center justify-center gap-6">
                            <div className="metallic-icon-container">
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
                                        <BookImage />
                                    </div>
                                </div>
                                <div className="gradient-overlay" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <p className="text-center text-xl text-white/60 font-medium">No posts yet</p>
                                <p className="text-center text-lg text-white/50">Wait for the groups to post something</p>
                            </div>
                        </div>
                    </div>
                ) : (
                        posts.map((post) => {
                            const commentCount = data?.filter((comment) => comment.post_id === post.id).length || 0;

                            return (
                                <div key={post.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                                    <GroupPostsGallery postId={post.id} />
                                    
                                    <div className="flex justify-between gap-4 items-start mt-4">
                                        <h2 className="text-white text-2xl font-bold tracking-wider">{post.post_title}</h2>
                                        <div>
                                            {pathname.includes('/dashboard') && groupId === post.group_id ? (
                                                <DeleteGroupPostsDialog postId={post.id} />
                                            ) : (
                                                <PostReportDialog postId={post.id} />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 mt-4">
                                        <div className="text-white/80 prose prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: post.post_content as string }}
                                        />
                                        <p className="text-white/50 text-sm">{format(parseISO(post.created_at as string), 'MMM dd, yyyy')}</p>
                                    </div>

                                    <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-white/10">
                                        {data?.filter((comment) => comment.post_id === post.id).slice(0, 3).map((comment) => (
                                            <div key={comment.id} className="flex justify-between items-start gap-4 bg-white/5 p-4 rounded-xl">
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
                                                <PostViewModal selectedUser={selectedUser}
                                                    post={post as any}
                                                    comments={data || [] as any}
                                                    profileImageUrls={profileImageUrls}
                                                    commentedUser={commentedUser.data || [] as any}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-white/10">
                                        <AddGroupComment postId={post.id} />
                                    </div>
                                </div>
                            );
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