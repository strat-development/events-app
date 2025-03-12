import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { GroupPostsGallery } from "./GroupPostsGallery";
import { DeleteGroupPostsDialog } from "@/components/dashboard/modals/groups/DeleteGroupPostsDialog";
import { PostReportDialog } from "@/components/dashboard/modals/contact/PostReportDialog";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IconDotsVertical } from "@tabler/icons-react";
import { ReportCommentDialog } from "@/components/dashboard/modals/contact/ReportCommentDialog";
import { AddGroupComment } from "./AddGroupComment";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { DeleteCommentDialog } from "@/components/dashboard/modals/posts/DeleteCommentDialog";
import { useUserContext } from "@/providers/UserContextProvider";
import { PostGallery } from "../custom-user-page/PostGallery";
import { AddComment } from "../custom-user-page/AddComment";
import { DeleteGroupCommentDialog } from "@/components/dashboard/modals/posts/DeleteGroupCommentDialog";

interface Post {
    id: string;
    post_title: string;
    post_content: string;
    group_id: string;
    created_at: string;
    user_id: string;
    images: string[];
}

interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    comment_content: string;
    created_at: string;
}

interface User {
    id: string;
    full_name: string;
}

interface ProfileImageUrl {
    userId: string;
    publicUrl: string;
}

interface PostViewModalProps {
    post: Post;
    comments: Comment[];
    profileImageUrls: ProfileImageUrl[];
    commentedUser: { users: User }[];
}

export const PostViewModal = ({ post, comments, profileImageUrls, commentedUser }: PostViewModalProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { userId } = useUserContext();
    const { id, post_title, post_content, group_id, created_at } = post;

    const isGroupPost = pathname.includes("group-posts");

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    className="bg-transparent w-full text-white/50 text-sm hover:bg-transparent hover:text-white/70"
                    variant="ghost">
                    View all comments
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[1200px] w-full">
                <div key={id} className="flex flex-col min-[1140px]:flex-row max-w-[1200px] w-full gap-8">
                    <div className="min-[1140px]:w-[70%]">
                        {isGroupPost ? (
                            <GroupPostsGallery postId={id} />
                        ) : (
                            <PostGallery postId={id} />
                        )}
                    </div>

                    <div className="flex flex-col min-[1140px]:w-[30%]">
                        <div className="flex flex-col gap-16 max-h-[240px] min-[1140px]:max-h-[400px] overflow-y-auto p-4">
                            <div className="flex w-full flex-col gap-4">
                                <div className="flex justify-between gap-4 items-center">
                                    <h2 className="text-white text-xl">{post_title}</h2>

                                    <div>
                                        {pathname.includes('/dashboard') && group_id && (
                                            <DeleteGroupPostsDialog postId={id} />
                                        ) || (
                                                <PostReportDialog postId={id} />
                                            )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="text-white/70"
                                        dangerouslySetInnerHTML={{ __html: post_content as string }}></div>
                                    <p className="text-white/50 text-sm justify-self-end">{format(parseISO(created_at as string), 'yyyy-MM-dd')}</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                {comments
                                    .filter((comment) => comment.post_id === id)
                                    .map((comment) => (
                                        <div key={comment.id} className="flex justify-between items-start gap-8">
                                            <div className="flex items-start gap-4">
                                                <div className="flex gap-4 items-start">
                                                    <Link href={`/user-profile/${comment.user_id}`} key={comment.user_id}>
                                                        <div className="flex gap-2">
                                                            <Image
                                                                src={profileImageUrls.find((url) => url.userId === comment.user_id)?.publicUrl || "/default-avatar.png"}
                                                                width={36}
                                                                height={36}
                                                                alt=""
                                                                className="rounded-full border border-white/10"
                                                                priority
                                                            />
                                                        </div>
                                                    </Link>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex gap-2 items-center">
                                                            <p className="text-white">
                                                                {commentedUser.find((user) => user.users?.id === comment.user_id)?.users?.full_name}
                                                            </p>
                                                            <p className="text-white/50 text-xs">
                                                                {format(parseISO(comment.created_at as string), 'yyyy-MM-dd')}
                                                            </p>
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
                                                <PopoverContent className="w-fit z-[999999]">
                                                    <div className="flex flex-col z-[999999]">
                                                        <ReportCommentDialog commentId={comment.id} />
                                                        {userId === comment.user_id && isGroupPost === false && (
                                                            <DeleteCommentDialog commentId={comment.id} />
                                                        ) || (
                                                            <DeleteGroupCommentDialog commentId={comment.id} />
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    ))}
                            </div>
                        </div>
                        {isGroupPost ? (
                            <AddGroupComment postId={id} />
                        ) : (
                            <AddComment postId={id} />
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};