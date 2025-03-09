import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { useQuery } from "react-query";
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { PostReportDialog } from "@/components/dashboard/modals/contact/PostReportDialog";
import { GroupPostsData } from "@/types/types";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { IconDotsVertical } from "@tabler/icons-react";
import { ReportCommentDialog } from "@/components/dashboard/modals/contact/ReportCommentDialog";
import { DeleteCommentDialog } from "@/components/dashboard/modals/posts/DeleteCommentDialog";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AddComment } from "../custom-user-page/AddComment";
import { CreateGroupPostDialog } from "@/components/dashboard/modals/posts/CreateGroupPostDialog";
import { GroupPostsGallery } from "./GroupPostsGallery";
import { DeleteGroupPostsDialog } from "@/components/dashboard/modals/groups/DeleteGroupPostsDialog";

interface GroupPostsSectionProps {
    groupId: string;
}

export const GroupPostsSection = ({ groupId }: GroupPostsSectionProps) => {
    const supabase = createClientComponentClient<Database>();
    const [posts, setPosts] = useState<GroupPostsData[]>([]);
    const [profileImageUrls, setProfileImageUrls] = useState<{ publicUrl: string }[]>([]);
    const [commentId, setCommentId] = useState<string[]>([]);
    const pathname = usePathname();

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
                .select(`users (id, full_name)`)
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
        if (commentedGroupId && commentedGroupId.length > 0) {
            const fetchProfileImages = async () => {
                const { data, error } = await supabase
                    .from('profile-pictures')
                    .select('user_id, image_url')
                    .in('user_id', commentedGroupId);

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

                setProfileImageUrls(Object.entries(urlMap).map(([_, url]) => ({ publicUrl: url })));
            };

            fetchProfileImages();
        }
    }, [commentedGroupId]);

    return (
        <>
            <div className="flex flex-col gap-8 items-center justify-center p-8 min-[1150px]:max-w-[55%] min-[1150px]:w-full">
                {pathname.includes('/dashboard') && <CreateGroupPostDialog groupId={groupId} />}

                {posts.map((post) => (
                    <div key={post.id} className="flex flex-col gap-4 w-full">
                        <GroupPostsGallery postId={post.id} />
                        <div className="flex w-full flex-col gap-4">
                            <div className="flex justify-between gap-4 items-center">
                                <h2 className="text-white text-xl">{post.post_title}</h2>

                                <div>
                                    {pathname.includes('/dashboard') && groupId === post.group_id && (
                                        <DeleteGroupPostsDialog postId={post.id} />
                                    ) || (
                                            <PostReportDialog postId={post.id} />
                                        )}
                                </div>

                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="text-white/70"
                                    dangerouslySetInnerHTML={{ __html: post.post_content as string }}></div>
                                <p className="text-white/50 text-sm justify-self-end">{format(parseISO(post.created_at as string), 'yyyy-MM-dd')}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 mt-8">
                            {data?.filter((comment) => comment.post_id === post.id).map((comment) => (
                                <div key={comment.id}
                                    className="flex justify-between items-start gap-8">
                                    <div className="flex items-start gap-4">
                                        <div className="flex gap-4 items-start">
                                            <Link href={`/user-profile/${comment.user_id}`} key={comment.user_id}>
                                                <div className="flex gap-2">
                                                    <Image src={profileImageUrls[0]?.publicUrl}
                                                        width={36}
                                                        height={36}
                                                        alt="" className="rounded-full border border-white/10"
                                                        priority />
                                                </div>
                                            </Link>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex gap-2 items-center">
                                                    <p className="text-white">{commentedUser.data?.find((user) => user.users?.id)?.users?.full_name}</p>
                                                    <p className="text-white/50 text-xs">{format(parseISO(comment.created_at as string), 'yyyy-MM-dd')}</p>
                                                </div>
                                                <p className="text-white/70">{comment.comment_content}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Popover>
                                        <PopoverTrigger>
                                            <div className="flex items-center gap-2 cursor-pointer text-white/50">
                                                <IconDotsVertical size={20} className="text-white/70" />
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-fit">
                                            <div className="flex flex-col gap-2">
                                                <ReportCommentDialog commentId={comment.id} />

                                                {groupId === comment.user_id && (
                                                    <DeleteCommentDialog commentId={comment.id} />
                                                )}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            ))}

                        </div>
                        <div className="flex flex-col gap-4">
                            <AddComment postId={post.id} />
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}