import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { toast } from "@/components/ui/use-toast";
import { supabaseAdmin } from "@/lib/admin";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

interface UpdateEventHeroImageDialogProps {
    eventId: string;
}

export const UpdateEventHeroImageDialog = ({ eventId }: UpdateEventHeroImageDialogProps) => {
    const supabase = createClientComponentClient<Database>();
    const [files, setFiles] = useState<File[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const addEventPicture = useMutation(
        async (paths: string[]) => {
            const results = await Promise.all(paths.map(async (path) => {
                const { data, error } = await supabase
                    .from('event-pictures')
                    .upsert({
                        event_id: eventId,
                        hero_picture_url: path
                    });
                if (error) {
                    throw error;
                }
                return data;
            }));

            return results;
        },
    );

    const updateEventPicture = useMutation(
        async (path: string) => {
            const { data: currentData, error: fetchError } = await supabase
                .from('event-pictures')
                .select('hero_picture_url')
                .eq('event_id', eventId)
                .single();

            if (fetchError) {
                throw fetchError;
            }

            const currentUrl = currentData?.hero_picture_url;

            if (currentUrl) {
                const { error: deleteError } = await supabaseAdmin.storage
                    .from('event-pictures')
                    .remove([currentUrl]);

                if (deleteError) {
                    throw deleteError;
                }
            }

            const { data, error } = await supabase
                .from('event-pictures')
                .update({
                    hero_picture_url: path
                })
                .eq('event_id', eventId);

            if (error) {
                throw error;
            }

            return data;
        },
        {
            onSuccess: () => {
                toast({
                    title: "Success",
                    description: "Image updated successfully",
                });

                queryClient.invalidateQueries('event-pictures');
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to update image",
                });
            }
        }
    );

    const uploadFiles = async (files: File[]) => {
        const uploadPromises = files.map((file) => {
            const path = `${file.name}${Math.random()}.${file.name.split('.').pop()}`;
            return { promise: supabaseAdmin.storage.from('event-pictures').upload(path, file), path };
        });

        const responses = await Promise.all(uploadPromises.map(({ promise }) => promise));

        responses.forEach((response, index) => {
            if (response.error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: `Error uploading file ${files[index].name}`
                })
            } else {
                toast({
                    title: "Success",
                    description: `File ${files[index].name} uploaded successfully`
                })
            }
        });

        return uploadPromises.map(({ path }) => path);
    }

    const { data: images, isLoading } = useQuery(
        ['event-pictures', eventId],
        async () => {
            const { data, error } = await supabase
                .from('event-pictures')
                .select('*')
                .eq('event_id', eventId)
            if (error) {
                throw error;
            }
            return data || [];
        },
        {
            enabled: !!eventId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline"
                        className="w-fit">Update image</Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px]">
                    <FileUpload onChange={setFiles} />

                    <DialogFooter>
                        {(images?.length ?? 0) === 0 ? (
                            <Button onClick={() => {
                                if (files.length > 0) {
                                    uploadFiles(files)
                                        .then((paths) => {
                                            addEventPicture.mutateAsync(paths);

                                            setFiles([]);
                                        })
                                        .catch((error) => console.error('Error uploading files:', error));
                                } else {
                                    toast({
                                        title: "Error",
                                        description: "Error uploading image",
                                    });
                                }
                            }}>Upload</Button>
                        ) : (
                            <HoverBorderGradient onClick={() => {
                                if (files.length > 0) {
                                    uploadFiles(files)
                                        .then((paths) => {
                                            updateEventPicture.mutateAsync(paths[0]);

                                            setFiles([]);
                                        })
                                        .catch((error) => console.error('Error uploading files:', error));
                                } else {
                                    toast({
                                        title: "Error",
                                        description: "Error uploading image",
                                    });
                                }
                            }}>Update</HoverBorderGradient>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </>
    )
}