import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";
import { supabaseAdmin } from "@/lib/admin";
import { Database } from "@/types/supabase";
import { DialogTitle } from "@radix-ui/react-dialog";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Trash } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";

interface DeleteGroupAlbumDialogProps {
    albumId: string;
}

export const DeleteGroupAlbumDialog = ({ albumId }: DeleteGroupAlbumDialogProps) => {
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);

    const deleteAlbumData = useMutation(
        async (albumId: string) => {
            const { data: albumData, error: fetchError } = await supabase
                .from('group-picture-albums')
                .select('image_urls')
                .eq('id', albumId)
                .single();
    
            if (fetchError) {
                if (fetchError.code === 'PGRST116') {
                    throw new Error("Album not found");
                }
                throw fetchError;
            }
    
            if (!albumData) {
                throw new Error("Album data is empty");
            }
    
            const { data: files, error: listError } = await supabaseAdmin.storage
                .from('group-albums-pictures')
                .list(albumId, { limit: 100 });
    
            if (listError) {
                console.error(`Error listing files in folder ${albumId}:`, listError);
                throw listError;
            }
    
            if (files.length === 0) {
                console.warn(`No files found in folder ${albumId}`);
            }
    
            const deleteFilePromises = files.map(async (file) => {
                const { error: deleteFileError } = await supabaseAdmin.storage
                    .from('group-albums-pictures')
                    .remove([`${albumId}/${file.name}`]);
    
                if (deleteFileError) {
                    console.error(`Error deleting file ${file.name}:`, deleteFileError);
                    throw deleteFileError;
                }
            });
    
            await Promise.all(deleteFilePromises);
    
            const { error: deleteError } = await supabase
                .from('group-picture-albums')
                .delete()
                .eq('id', albumId);
    
            if (deleteError) {
                throw deleteError;
            }
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['group-picture-albums']);
                toast({
                    title: "Success",
                    description: "Album deleted successfully",
                });
    
                setIsOpen(false);
            },
            onError: (error) => {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "There was an error deleting the album"
                });
            }
        }
    );

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Trash className="text-red-500" />
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Album</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this Album? If not please close this dialog.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="destructive"
                            type="submit"
                            onClick={() => {
                                deleteAlbumData.mutate(albumId);
                            }}>
                            Delete Album
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </>
    );
}