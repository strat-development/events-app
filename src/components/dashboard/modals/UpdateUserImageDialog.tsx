import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { toast } from "@/components/ui/use-toast";
import { supabaseAdmin } from "@/lib/admin";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

export const UpdateUserImageDialog = () => {
    const supabase = createClientComponentClient<Database>();
    const [files, setFiles] = useState<File[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [imageUrls, setImageUrls] = useState<{ publicUrl: string }[]>([]);
    const { userId } = useUserContext();
    const queryClient = useQueryClient();

    const addProfilePicture = useMutation(
        async (paths: string[]) => {
            const { data: currentData, error: currentError } = await supabase
                .from('profile-pictures')
                .select('image_url')
                .eq('user_id', userId)
                .single();

            if (currentError) {
                throw currentError;
            }

            if (currentData && currentData.image_url) {
                const { error: deleteError } = await supabaseAdmin
                    .storage
                    .from('profile-pictures')
                    .remove([currentData.image_url]);

                if (deleteError) {
                    throw deleteError;
                }
            }

            const results = await Promise.all(paths.map(async (path) => {
                const { data, error } = await supabase
                    .from('profile-pictures')
                    .update({
                        user_id: userId,
                        image_url: path
                    })
                    .eq('user_id', userId);

                if (error) {
                    throw error;
                }
                return data;
            }));

            return results;
        },
    );

    const uploadFiles = async (files: File[]) => {
        const uploadPromises = files.map((file) => {
            const path = `${file.name}${Math.random()}.${file.name.split('.').pop()}`;
            return { promise: supabaseAdmin.storage.from('profile-pictures').upload(path, file), path };
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
        ['profile-pictures', userId],
        async () => {
            const { data, error } = await supabase
                .from('profile-pictures')
                .select('*')
                .eq('user_id', userId)
            if (error) {
                throw error;
            }
            return data || [];
        },
        {
            enabled: !!userId
        }
    );

    useEffect(() => {
        if (images) {
            Promise.all(images.map(async (image) => {
                const { data: publicURL } = await supabase.storage
                    .from('profile-pictures')
                    .getPublicUrl(image.image_url)

                return { publicUrl: publicURL.publicUrl };

            }))
                .then((publicUrls) => setImageUrls(publicUrls))
                .catch(console.error);
        }
    }, [images]);

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline"
                    className="w-fit">Update image</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <FileUpload onChange={setFiles} />

                    <DialogFooter>
                        <Button onClick={() => {
                            if (files.length > 0) {
                                uploadFiles(files)
                                    .then((paths) => {
                                        return addProfilePicture.mutateAsync(paths), {
                                            onSuccess: () => {
                                                toast({
                                                    title: "Success",
                                                    description: "Image updated successfully",
                                                });

                                                queryClient.invalidateQueries(['profile-pictures', userId]);

                                                setIsOpen(false);
                                            },
                                            onError: () => {
                                                toast({
                                                    title: "Error",
                                                    description: "Error updating image",
                                                });
                                            }
                                        }
                                    })
                                    .catch((error) => console.error('Error uploading files:', error));
                            } else {
                                toast({
                                    title: "Error",
                                    description: "Error uploading image",
                                });
                            }
                        }
                        }>Update image</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </>
    )
}