import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { toast } from "@/components/ui/use-toast";
import { supabaseAdmin } from "@/lib/admin";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

interface UpdateGroupHeroImageDialogProps {
    groupId: string;
}

export const UpdateGroupHeroImageDialog = ({ groupId }: UpdateGroupHeroImageDialogProps) => {
    const supabase = createClientComponentClient<Database>();
    const [files, setFiles] = useState<File[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const addGroupPicture = useMutation(
        async (paths: string[]) => {
            const results = await Promise.all(paths.map(async (path) => {
                const { data, error } = await supabase
                    .from('group-pictures')
                    .upsert({
                        group_id: groupId,
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

    const updateGroupPicture = useMutation(
        async (path: string) => {
            const { data: currentData, error: fetchError } = await supabase
                .from('group-pictures')
                .select('hero_picture_url')
                .eq('group_id', groupId)
                .single();

            if (fetchError) {
                throw fetchError;
            }

            const currentUrl = currentData?.hero_picture_url;

            if (currentUrl) {
                const { error: deleteError } = await supabaseAdmin.storage
                    .from('group-pictures')
                    .remove([currentUrl]);

                if (deleteError) {
                    throw deleteError;
                }
            }

            const { data, error } = await supabase
                .from('group-pictures')
                .update({
                    hero_picture_url: path
                })
                .eq('group_id', groupId);

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

                queryClient.invalidateQueries('group-pictures');
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
            return { promise: supabaseAdmin.storage.from('group-pictures').upload(path, file), path };
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
        ['group-pictures', groupId],
        async () => {
            const { data, error } = await supabase
                .from('group-pictures')
                .select('*')
                .eq('group_id', groupId)
            if (error) {
                throw error;
            }
            return data || [];
        },
        {
            enabled: !!groupId,
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
                <FileUpload
                        onChange={(selectedFiles) => {
                            setFiles(selectedFiles);
                        }}
                    />

                    <DialogFooter>
                        {(images?.length ?? 0) === 0 ? (
                            <HoverBorderGradient onClick={() => {
                                if (files.length > 0) {
                                    uploadFiles(files)
                                        .then((paths) => {
                                            addGroupPicture.mutateAsync(paths);

                                            setFiles([]);
                                        })
                                        .catch((error) => console.error('Error uploading files:', error));
                                } else {
                                    toast({
                                        title: "Error",
                                        description: "Error uploading image",
                                    });
                                }
                            }}>Upload</HoverBorderGradient>
                        ) : (
                            <HoverBorderGradient onClick={() => {
                                if (files.length > 0) {
                                    uploadFiles(files)
                                        .then((paths) => {
                                            updateGroupPicture.mutateAsync(paths[0]);

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