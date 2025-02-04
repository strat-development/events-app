"use client";

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { FileUpload } from "@/components/ui/file-upload";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { toast } from "@/components/ui/use-toast"
import { supabaseAdmin } from "@/lib/admin";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

export const UpdateGroupImagesAlbumDialog = () => {
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();

    const [isOpen, setIsOpen] = useState(false);
    const queryParams = useSearchParams();
    const albumId = queryParams.get('albumId');
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [files, setFiles] = useState<File[]>([]);

    const { data: albumsData, error: albumsError } = useQuery(
        ['group-picture-albums-urls', albumId],
        async () => {
            const { data, error } = await supabase
                .from('group-picture-albums')
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
        },
        {
            cacheTime: 10 * 60 * 1000,
        }
    );

    const updateImagesMutation = useMutation(
        async (newImageUrls: string[]) => {
            const { data, error } = await supabase
                .from('group-picture-albums')
                .update({ image_urls: JSON.stringify(newImageUrls) })
                .eq('id', albumId ?? '');

            if (error) {
                throw error;
            }

            return data;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['group-picture-albums-urls', albumId]);
            },
        }
    );

    const handleSubmit = async () => {
        const newFileUrls = files.map(file => `${albumId}/${file.name}`);
        const newImageUrls = [...imageUrls, ...newFileUrls];
        setImageUrls(newImageUrls);

        await updateImagesMutation.mutateAsync(newImageUrls);
        await uploadFiles(files, newFileUrls);

        setFiles([]);
        setIsOpen(false);
    };

    const uploadFiles = async (files: File[], fileUrls: string[]) => {
        const uploadPromises = files.map((file, index) => {
            const path = fileUrls[index];
            return supabaseAdmin.storage.from('group-albums-pictures').upload(path, file);
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
        <div className="justify-self-end">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button>Upload more</Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px]">
                <FileUpload
                        onChange={(selectedFiles) => {
                            const validFiles = selectedFiles.filter((file) => {
                                const isValidSize = file.size <= 2 * 1024 * 1024;
                                const isValidType = file.type.startsWith("image/");

                                if (!isValidSize) {
                                    toast({
                                        variant: "destructive",
                                        title: "File Too Large",
                                        description: `${file.name} exceeds the 2MB size limit.`,
                                    });
                                }

                                if (!isValidType) {
                                    toast({
                                        variant: "destructive",
                                        title: "Invalid File Type",
                                        description: `${file.name} is not an image.`,
                                    });
                                }

                                return isValidSize && isValidType;
                            });

                            setFiles(validFiles);
                        }}
                    />

                    <DialogFooter className="flex justify-center w-full">
                        <HoverBorderGradient
                            onClick={handleSubmit}>Update album</HoverBorderGradient>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};