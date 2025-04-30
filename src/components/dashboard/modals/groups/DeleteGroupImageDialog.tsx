"use client"


import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";;
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabaseAdmin } from "@/lib/admin";
import { Trash } from "lucide-react";

interface DeleteGroupPictureDialogProps {
    images: any;
}

export const DeleteGroupPictureDialog = ({ images }: DeleteGroupPictureDialogProps) => {
    const supabase = createClientComponentClient<Database>()
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient()

    const deleteGroupPicture = useMutation(
        async (path: string) => {
            const { data, error } = await supabase
                .from('group-pictures')
                .delete()
                .eq('hero_picture_url', path);
            if (error) {
                throw error;
            }

            const { error: storageError } = await supabaseAdmin.storage
                .from('group-pictures')
                .remove([path]);

            if (storageError) {
                throw storageError;
            }

            return data;
        },
        {
            onSuccess: () => {
                toast({
                    title: "Success",
                    description: "Image deleted successfully",
                });

                queryClient.invalidateQueries('group-pictures');
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to delete image",
                });
            }
        }
    );

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button className="w-fit flex gap-2 text-red-500 border border-red-500 hover:bg-red-500 hover:text-white" 
                    variant="ghost">
                        <span className="text-white">Delete image</span><Trash size={20} /> 
                        </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete picture</DialogTitle>
                        <DialogDescription className="text-white/70">
                            Are you sure you want to delete this picture? If not please close this dialog.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant={"destructive"}
                            onClick={() => {
                                if (images) {
                                    if (images[0].hero_picture_url) {
                                        deleteGroupPicture.mutateAsync(images[0].hero_picture_url);
                                    }
                                }
                            }}>Delete picture</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            
        </>
    );
};