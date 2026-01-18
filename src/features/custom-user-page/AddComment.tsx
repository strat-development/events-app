"use client"

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast";
import { useUserContext } from "@/providers/UserContextProvider";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { createComment } from "@/fetchers/comments/createComment";

interface AddCommentProps {
    postId: string;
}

export const AddComment = ({ postId }: AddCommentProps) => {
    const { userId } = useUserContext();
    const [comment, setComment] = useState<string>('');
    const queryClient = useQueryClient();

    const addCommentMutation = useMutation(
        async (comment: string) => {
            await createComment({
                comment_content: comment,
                post_id: postId,
                user_id: userId!,
            });
        },
        {
            onSuccess: () => {
                setComment('');
                toast({
                    title: "Comment added",
                    description: "Your comment has been added to the post.",
                });
                queryClient.invalidateQueries('post-comments');
            },
            onError: () => {
                toast({
                    title: "Error adding comment",
                    description: "There was an error adding your comment. Please try again later.",
                });
            }
        }
    )

    return (
        <>
            <Textarea className="border-none bg-transparent placeholder:text-white/70"
                placeholder="Add a comment..."
                onChange={(e) => setComment(e.target.value)} />
            {comment.length > 0 &&
                <Button className="w-fit"
                    onClick={() => {
                        addCommentMutation.mutateAsync(comment);
                    }}>Submit</Button>
            }
        </>
    )
}