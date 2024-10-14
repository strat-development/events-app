"use client";

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { supabaseAdmin } from "@/lib/admin";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";

interface CreateEventImagesAlbumDialogProps {
    eventId: string;
}

export const CreateEventImagesAlbumDialog = ({ eventId }: CreateEventImagesAlbumDialogProps) => {
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();

    const [isOpen, setIsOpen] = useState(false);
    const [albumName, setAlbumName] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const todayDate = new Date().toISOString().slice(0, 10);

    const addAlbumData = useMutation(
        async (newAlbumData: { album_name: string, event_id: string, created_at: string }) => {
            const { data, error } = await supabase
                .from("event-picture-albums")
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
                queryClient.invalidateQueries(['event-picture-albums']);
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
                .from('event-picture-albums')
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
                .from('event-picture-albums')
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
            return { promise: supabaseAdmin.storage.from('event-picture-albums').upload(path, file), path };
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
        <div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button>Add images</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add images</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to add images to this album? Please fill out all fields.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="Album Name"
                        value={albumName}
                        onChange={(e) => setAlbumName(e.target.value)}
                    />

                    <div className="flex flex-col gap-4">
                        <div className="flex gap-4">
                            <Input type="file"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setFiles([...files, ...Array.from(e.target.files)]);
                                    }
                                }} />

                            {files.length > 0 && (
                                <Button variant={"destructive"}
                                    onClick={() => setFiles([])}>
                                    Clear
                                </Button>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            {files.length > 0 && (
                                <>
                                    {files.map((file, index) => (
                                        <div key={index}>
                                            <p>{file.name}</p>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>



                    <DialogFooter>
                        <Button onClick={() => {
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
                                    event_id: eventId,
                                    created_at: todayDate
                                }, {
                                    onSuccess: (data) => {
                                        if (files.length > 0) {
                                            uploadFiles(files, data.id)
                                                .then((paths) => {
                                                    return addPicture.mutateAsync({ albumId: data.id, paths });
                                                })
                                                .catch((error) => console.error('Error uploading files:', error));
                                        } else {
                                            toast({
                                                title: "Error",
                                                description: "Error uploading image",
                                            });
                                        }
                                    }
                                });
                            }
                        }}>Add Images</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}