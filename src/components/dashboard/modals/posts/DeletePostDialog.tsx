import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/toaster";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { useQueryClient } from "react-query";
import { supabaseAdmin } from "@/lib/admin";

interface DeletePostDialogProps {
    postId: string;
}

export const DeletePostDialog = ({ postId }: DeletePostDialogProps) => {
    const supabase = createClientComponentClient<Database>();
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const deletePostAndImages = async () => {
        try {
            const { data: postImages, error: fetchError } = await supabase
                .from("post-pictures")
                .select("image_urls")
                .eq("post_id", postId)
                .single();

            if (fetchError) {
                throw fetchError;
            }

            const imagePaths = postImages?.image_urls
                ? JSON.parse(postImages.image_urls as string)
                : [];

            if (imagePaths.length > 0) {
                const { error: storageError } = await supabaseAdmin.storage
                    .from("posts-pictures")
                    .remove(imagePaths);

                if (storageError) {
                    throw storageError;
                }
            }

            const { error: deletePostError } = await supabase
                .from("posts")
                .delete()
                .eq("id", postId);

            if (deletePostError) {
                throw deletePostError;
            }

            const { error: deletePicturesError } = await supabase
                .from("post-pictures")
                .delete()
                .eq("post_id", postId);

            if (deletePicturesError) {
                throw deletePicturesError;
            }

            toast({
                title: "Post Deleted",
                description: "The post has been successfully deleted.",
            });

            queryClient.invalidateQueries(['posts']);
            setIsOpen(false);
        } catch (error) {
            console.error("Error deleting post or images:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "An error occurred while deleting the post.",
            });
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="destructive">Delete Post</Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete post</DialogTitle>
                        <DialogDescription className="text-white/70">
                            Are you sure you want to delete this post and all its associated images? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="destructive"
                            onClick={deletePostAndImages}>
                            Delete post
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </>
    );
};
