import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { useMutation, useQueryClient } from "react-query";
import { Trash } from "lucide-react";

interface DeleteGroupCommentDialogProps {
    commentId: string;
}

export const DeleteGroupCommentDialog = ({ commentId }: DeleteGroupCommentDialogProps) => {
    const supabase = createClientComponentClient<Database>();
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const deleteComment = useMutation(
        async (commentId: string) => {
            const { data: comments, error: fetchError } = await supabase
                .from("group-posts-comments")
                .delete()
                .eq("id", commentId)
        },
        {
            onSuccess: () => {
                toast({
                    title: "Success",
                    description: "Comment deleted successfully",
                });

                queryClient.invalidateQueries("group-posts-comments");
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
                    <Button variant="ghost"
                        className="w-fit flex items-center mt-2 gap-2 cursor-pointer text-white/50"
                        onClick={() => setIsOpen(true)}>
                        Delete
                        <Trash className="text-red-500" size={20} />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Comment</DialogTitle>
                        <DialogDescription className="text-white/70">
                            Are you sure you want to delete this comment and all its associated images? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button className="text-red-500"
                            variant="ghost"
                            onClick={() => deleteComment.mutateAsync(commentId)}>
                            <Trash size={20} />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            
        </>
    );
};
