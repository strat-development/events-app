import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { useQueryClient } from "react-query";
import { supabaseAdmin } from "@/lib/admin";
import { Trash } from "lucide-react";

interface DeleteGroupPostsDialogProps {
    postId: string;
}

export const DeleteGroupPostsDialog = ({ postId }: DeleteGroupPostsDialogProps) => {
    const supabase = createClientComponentClient<Database>();
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const deletePostAndImages = async () => {
        try {
            const { data: postImages, error: fetchError } = await supabase
                .from("group-posts-pictures")
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
                    .from("group-posts-pictures")
                    .remove(imagePaths);

                if (storageError) {
                    throw storageError;
                }
            }

            const { error: deletePostError } = await supabase
                .from("group-posts")
                .delete()
                .eq("id", postId);

            if (deletePostError) {
                throw deletePostError;
            }

            const { error: deletePicturesError } = await supabase
                .from("group-posts-pictures")
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
                    <Button className="w-fit flex gap-2 text-red-500 border border-red-500 hover:bg-red-500 hover:text-white"
                        variant="ghost">
                        <span className="text-white">Delete Post</span><Trash size={20} />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px] z-[999999]">
                    <DialogHeader>
                        <DialogTitle>Delete post</DialogTitle>
                        <DialogDescription className="text-white/70">
                            Are you sure you want to delete this post and all its associated images? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button className="text-red-500"
                            variant="ghost"
                            onClick={deletePostAndImages}>
                            <Trash size={20} />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            
        </>
    );
};
