"use client"


import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { Toaster } from "@/components/ui/toaster";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabaseAdmin } from "@/lib/admin";

interface DeleteEventPictureDialogProps {
    images: any;
}

export const DeleteEventPictureDialog = ({ images }: DeleteEventPictureDialogProps) => {
    const supabase = createClientComponentClient<Database>()
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient()

    const deleteEventPicture = useMutation(
        async (path: string) => {
            const { data, error } = await supabase
                .from('event-pictures')
                .delete()
                .eq('hero_picture_url', path);
            if (error) {
                throw error;
            }

            const { error: storageError } = await supabaseAdmin.storage
                .from('event-pictures')
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

                queryClient.invalidateQueries('event-pictures');
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
                    <Button className="w-fit" 
                    variant="destructive">Delete</Button>
                </DialogTrigger>
                <DialogContent className="max-w-[240px]">
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
                                        deleteEventPicture.mutateAsync(images[0].hero_picture_url);
                                    }
                                }
                            }}>Delete picture</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </>
    );
};