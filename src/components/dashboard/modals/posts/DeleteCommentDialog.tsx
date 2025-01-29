import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/toaster";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { useMutation, useQueryClient } from "react-query";
import { supabaseAdmin } from "@/lib/admin";

interface DeleteCommentDialogProps {
    commentId: string;
    onAction?: () => void;
}

export const DeleteCommentDialog = ({ commentId, onAction }: DeleteCommentDialogProps) => {
    const supabase = createClientComponentClient<Database>();
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const deleteComment = useMutation(
        async (commentId: string) => {
            const { data: comments, error: fetchError } = await supabase
                .from("post-comments")
                .delete()
                .eq("id", commentId)
        },
        {
            onSuccess: () => {
                toast({
                    title: "Success",
                    description: "Comment deleted successfully",
                });

                queryClient.invalidateQueries("comment-comments");
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to delete comment",
                });
            },
        })

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="destructive">Delete</Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Comment</DialogTitle>
                        <DialogDescription className="text-white/70">
                            Are you sure you want to delete this comment and all its associated images? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="destructive"
                            onClick={() => deleteComment.mutateAsync(commentId)}>
                            Delete comment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </>
    );
};
