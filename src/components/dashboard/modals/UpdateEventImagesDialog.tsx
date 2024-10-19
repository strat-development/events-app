"use client";

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { supabaseAdmin } from "@/lib/admin";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

export const UpdateEventImagesAlbumDialog = () => {
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();

    const [isOpen, setIsOpen] = useState(false);
    const queryParams = new URLSearchParams(window.location.search);
    const albumId = queryParams.get('albumId');
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [files, setFiles] = useState<File[]>([]);

    const { data: albumsData, error: albumsError } = useQuery(
        ['event-picture-albums-urls', albumId],
        async () => {
            const { data, error } = await supabase
                .from('event-picture-albums')
                .select('image_urls')
                .eq('id', albumId ?? '');
            if (error) {
                throw error;
            }
    
            if (data && data.length > 0) {
                if (data[0].image_urls) {
                    setImageUrls(JSON.parse(data[0].image_urls as string));
                }
            }
    
            return data || [];
        }
    );

    const updateImagesMutation = useMutation(
        async (newImageUrls: string[]) => {
            const { data, error } = await supabase
                .from('event-picture-albums')
                .update({ image_urls: JSON.stringify(newImageUrls) })
                .eq('id', albumId ?? '');

            console.log(newImageUrls);
    
            if (error) {
                throw error;
            }
    
            return data;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['event-picture-albums-urls', albumId]);
            },
        }
    );

    const handleSubmit = async () => {
        const newFileUrls = files.map(file => `${albumId}/${file.name}`);
        const newImageUrls = [...imageUrls, ...newFileUrls];
        setImageUrls(newImageUrls);

        console.log(newImageUrls);

        await updateImagesMutation.mutateAsync(newImageUrls);
        await uploadFiles(files, newFileUrls);

        setFiles([]);
        setIsOpen(false);
    };

    const uploadFiles = async (files: File[], fileUrls: string[]) => {
        const uploadPromises = files.map((file, index) => {
            const path = fileUrls[index];
            return supabaseAdmin.storage.from('event-albums').upload(path, file);
        });

        const responses = await Promise.all(uploadPromises);

        const paths = responses.map((response, index) => {
            if (response.error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: `Error uploading file ${files[index].name}`
                });
                throw response.error;
            }
            return fileUrls[index];
        });
    
        return paths;
    };

    return (
        <div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button>Update album</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Update album</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to add images to this album? Please fill out all fields.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4">
                        <div className="flex gap-4">
                            <Input type="file"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setFiles(Array.from(e.target.files));
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSubmit}>Update album</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};