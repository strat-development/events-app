"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { useState } from "react";
import { TextEditor } from "../../../../features/TextEditor";
import { Toaster } from "@/components/ui/toaster";
import { FileUpload } from "@/components/ui/file-upload";
import { useMutation, useQueryClient } from "react-query";
import { useUserContext } from "@/providers/UserContextProvider";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { toast } from "@/components/ui/use-toast";
import { supabaseAdmin } from "@/lib/admin";
import { Input } from "@/components/ui/input";

export const CreatePostDialog = () => {
    const { userId } = useUserContext();
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();
    const [modalStepCount, setModalStepCount] = useState(1);
    const [isOpen, setIsOpen] = useState(false);
    const [editorContent, setEditorContent] = useState("");
    const [title, setTitle] = useState("");
    const [files, setFiles] = useState<File[]>([]);

    const createPost = useMutation(
        async () => {
            const { data, error } = await supabase
                .from("posts")
                .insert([
                    {
                        post_content: editorContent,
                        user_id: userId,
                        post_title: title
                    },
                ])
                .select("id")
                .single();

            if (error) {
                throw error;
            }

            return data;
        },
        {
            onSuccess: async (data) => {
                if (files.length > 0) {
                    await uploadFilesAndAddToPost(data.id);
                }

                toast({
                    title: "Post created",
                    description: "Your post has been created successfully",
                });

                queryClient.invalidateQueries(['posts']);
                setIsOpen(false);
                setEditorContent("");
                setFiles([]);
                setTitle("");
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "An error occurred while creating your post",
                });
            },
        }
    );

    const uploadFilesAndAddToPost = async (postId: string) => {
        try {
            const paths = await uploadFiles(files, postId);
            await addImagesToPost(postId, paths);
        } catch (error) {
            console.error("Error uploading files or adding to post:", error);
        }
    };

    const uploadFiles = async (files: File[], postId: string) => {
        const uploadPromises = files.map((file) => {
            const path = `${postId}/${file.name}${Math.random()}.${file.name.split('.').pop()}`;
            return { promise: supabaseAdmin.storage.from('posts-pictures').upload(path, file), path };
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

    const addImagesToPost = async (postId: string, paths: string[]) => {
        const { data: existingData, error: fetchError } = await supabase
            .from('post-pictures')
            .select('image_urls')
            .eq('post_id', postId)
            .maybeSingle();

        if (fetchError) {
            throw fetchError;
        }

        let existingUrls = [];
        if (existingData && existingData.image_urls) {
            existingUrls = JSON.parse(existingData.image_urls as string);
        }

        const newUrls = [...existingUrls, ...paths];
        const imageUrlsJson = JSON.stringify(newUrls);

        const { error: upsertError } = await supabase
            .from('post-pictures')
            .upsert({ post_id: postId, image_urls: imageUrlsJson });

        if (upsertError) {
            throw upsertError;
        }
    };


    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button
                        className="bg-transparent w-full"
                        variant="outline">
                        Create Post
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px] pt-12 overflow-x-hidden">
                    <div className="flex flex-col gap-4">
                        {modalStepCount === 1 && (
                            <div className="flex flex-col gap-4 items-center justify-center">
                                <Input onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Title" />
                                <TextEditor
                                    {...{
                                        editorContent: editorContent,
                                        onChange: setEditorContent,
                                    }}
                                />
                                <Button className="w-full" onClick={() => setModalStepCount(2)}>
                                    Next step
                                </Button>
                            </div>
                        )}


                        {modalStepCount === 2 && (
                            <div className="flex flex-col gap-4 items-center justify-center">
                                <FileUpload
                                    className="max-h-[350px] overflow-y-auto overflow-x-hidden"
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

                                <Button className="w-full" onClick={() => setModalStepCount(1)}>
                                    Previous step
                                </Button>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        {editorContent.length > 0 && (
                            <HoverBorderGradient onClick={() => createPost.mutate()}>
                                Create Post
                            </HoverBorderGradient>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </>
    );
};
