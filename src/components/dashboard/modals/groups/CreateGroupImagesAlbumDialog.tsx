"use client";

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileUpload } from "@/components/ui/file-upload";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { supabaseAdmin } from "@/lib/admin";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";

interface CreateGroupImagesAlbumDialogProps {
    groupId: string;
}

export const CreateGroupImagesAlbumDialog = ({ groupId }: CreateGroupImagesAlbumDialogProps) => {
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();

    const [isOpen, setIsOpen] = useState(false);
    const [albumName, setAlbumName] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const todayDate = new Date().toISOString().slice(0, 10);

    const addAlbumData = useMutation(
        async (newAlbumData: { album_name: string, group_id: string, created_at: string }) => {
            const { data, error } = await supabase
                .from("group-picture-albums")
                .upsert(newAlbumData)
                .select('id')
                .single();

            if (error) {
                throw error;
            }

            return data;
        },
        {
            onSuccess: (data) => {
                queryClient.invalidateQueries(['group-picture-albums']);
                toast({
                    title: "Success",
                    description: "Album created successfully",
                });

                setIsOpen(false);
            },

            onError: () => {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "There was an error creating an album"
                });
            }
        }
    );

    const addPicture = useMutation(
        async ({ albumId, paths }: { albumId: string, paths: string[] }) => {
            const { data: existingData, error: fetchError } = await supabase
                .from('group-picture-albums')
                .select('image_urls')
                .eq('id', albumId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            let existingUrls = [];
            if (existingData && existingData.image_urls) {
                existingUrls = JSON.parse(existingData.image_urls as string);
            }

            const newUrls = [...existingUrls, ...paths];
            const imageUrlsJson = JSON.stringify(newUrls);

            const { data, error } = await supabase
                .from('group-picture-albums')
                .update({ image_urls: imageUrlsJson })
                .eq('id', albumId);

            if (error) {
                throw error;
            }

            return data;
        },
    );

    const uploadFiles = async (files: File[], albumId: string) => {
        const uploadPromises = files.map((file) => {
            const path = `${albumId}/${file.name}${Math.random()}.${file.name.split('.').pop()}`;
            return { promise: supabaseAdmin.storage.from('group-albums-pictures').upload(path, file), path };
        });

        const responses = await Promise.all(uploadPromises.map(({ promise }) => promise));

        const paths = responses.map((response, index) => {
            if (response.error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: `Error uploading file ${files[index].name}`
                });
                throw response.error;
            }
            return uploadPromises[index].path;
        });

        return paths;
    };

    return (
        <div className="justify-self-end">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button>Add images</Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px]">
                    <Input className="mt-8"
                        placeholder="Album Name"
                        value={albumName}
                        onChange={(e) => setAlbumName(e.target.value)}
                    />

                    <FileUpload onChange={setFiles} />

                    <DialogFooter>
                        <HoverBorderGradient
                            onClick={() => {
                                if (!albumName) {
                                    toast({
                                        variant: "destructive",
                                        title: "Error",
                                        description: "Please fill out all fields"
                                    });
                                    return;
                                } else {
                                    addAlbumData.mutate({
                                        album_name: albumName,
                                        group_id: groupId,
                                        created_at: todayDate
                                    }, {
                                        onSuccess: (data) => {
                                            if (files.length > 0) {
                                                uploadFiles(files, data.id)
                                                    .then((paths) => {
                                                        return addPicture.mutateAsync({ albumId: data.id, paths });
                                                    })
                                                    .catch((error) => console.error('Error uploading files:', error));

                                                queryClient.invalidateQueries(['group-picture-albums']);

                                                setIsOpen(false);
                                            } else {
                                                toast({
                                                    title: "Error",
                                                    description: "Error uploading image",
                                                });
                                            }
                                        }
                                    });
                                }
                            }}>Add Images</HoverBorderGradient>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}