"use client";

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { FileUpload } from "@/components/ui/file-upload";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { toast } from "@/components/ui/use-toast"
import { supabaseAdmin } from "@/lib/admin";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ImageUp } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

export const UpdateEventImagesAlbumDialog = () => {
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();

    const [isOpen, setIsOpen] = useState(false);
    const queryParams = useSearchParams();
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
        },
        {
            cacheTime: 10 * 60 * 1000,
        }
    );

    const updateImagesMutation = useMutation(
        async (newImageUrls: string[]) => {
            const { data, error } = await supabase
                .from('event-picture-albums')
                .update({ image_urls: JSON.stringify(newImageUrls) })
                .eq('id', albumId ?? '');

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
        <div className="justify-self-end">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button className="w-fit flex gap-2 text-blue-500 border border-blue-500 hover:bg-blue-500 hover:text-white"
                        variant="ghost">
                        <span className="text-white">Upload Images</span><ImageUp size={20} />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px]">
                    <FileUpload
                        onChange={(selectedFiles) => {
                            setFiles(selectedFiles);
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