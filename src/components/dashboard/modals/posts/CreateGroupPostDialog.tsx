"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { useState } from "react";
import { TextEditor } from "../../../../features/TextEditor";
import { FileUpload } from "@/components/ui/file-upload";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { toast } from "@/components/ui/use-toast";
import { supabaseAdmin } from "@/lib/admin";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface CreateGroupPostDialogProps {
    groupId: string;
}

export const CreateGroupPostDialog = ({ groupId }: CreateGroupPostDialogProps) => {
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [editorContent, setEditorContent] = useState("");
    const [title, setTitle] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [fullName, setFullName] = useState<string[]>([]);
    const [groupName, setGroupName] = useState<string>("");
    const [email, setEmail] = useState<string[]>([]);

    const groupData = useQuery(
        ["group", groupId],
        async () => {
            const { data, error } = await supabase
                .from("groups")
                .select("group_name")
                .eq('id', groupId);

            if (error) {
                console.error("Error fetching group data:", error.message);
                throw new Error(error.message);
            }

            if (data) {
                setGroupName(data[0].group_name || "");
            }

            return data;
        },
        {
            enabled: isOpen,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
        }
    );

    const membersData = useQuery(
        ["group-members", groupId],
        async () => {
            const { data, error } = await supabase
                .from("group-members")
                .select(`users (id, full_name, email)`)
                .eq("group_id", groupId);

            if (error) {
                console.error("Error fetching attendees data:", error.message);
                throw new Error(error.message);
            }

            if (data) {
                setEmail(data.map((member) => member.users ? member.users.email as string : ""));
                setFullName(data.map((member) => member.users ? member.users.full_name as string : ""));
            }
        }, {
        enabled: isOpen,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });

    const createPost = useMutation(
        async () => {
            const { data, error } = await supabase
                .from("group-posts")
                .insert([
                    {
                        post_content: editorContent,
                        group_id: groupId,
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

                const emailResponse = await fetch('/api/post-notification', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        userFullName: fullName,
                        groupName: groupName,
                    })
                });

                if (!emailResponse.ok) {
                    throw new Error('Failed to send emails');
                }

                toast({
                    title: "Post created",
                    description: "Your post has been created successfully",
                });

                queryClient.invalidateQueries(['group-posts']);
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
            return { promise: supabaseAdmin.storage.from('group-posts-pictures').upload(path, file), path };
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
            .from('group-posts-pictures')
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
            .from('group-posts-pictures')
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
                        className="flex flex-col items-center justify-center w-full h-[440px] rounded-xl bg-transparent hover:bg-white/5 transition-all duration-300"
                        variant="ghost">
                        <div className="flex flex-col items-center">
                            <div className="text-6xl text-white/70">
                                <Plus size={128} />
                            </div>
                            <p className="text-xl tracking-wide text-white/50 font-medium">Create new post</p>
                        </div>
                    </Button>
                </DialogTrigger>
                <DialogContent className="flex w-full max-w-[100vw] h-screen rounded-none bg-transparent">
                    <div className="relative flex flex-row max-[900px]:flex-col max-[900px]:items-center items-start max-h-[80vh] overflow-y-auto justify-center w-full gap-16 mt-24">
                        <FileUpload className="max-[900px]:mt-48"
                            onChange={(selectedFiles) => {
                                setFiles(selectedFiles);
                            }}
                        />
                        <div className="flex flex-col gap-4 max-w-[480px]">
                            <Input
                                className="placeholder:text-white/60 bg-transparent border-none text-2xl outline-none"
                                placeholder="Post Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <TextEditor
                                {...{
                                    editorContent: editorContent,
                                    onChange: setEditorContent,
                                }}
                            />
                            <div className="flex justify-between gap-4">
                                {title && editorContent && (
                                    <HoverBorderGradient className="w-full"
                                        onClick={() => {
                                            if (!title || !editorContent) {
                                                toast({
                                                    variant: "destructive",
                                                    title: "Invalid Fields",
                                                    description: "Please fill all the required fields.",
                                                });
                                                return;
                                            } else {
                                                createPost.mutate();
                                            }
                                        }}
                                    >
                                        Create Post
                                    </HoverBorderGradient>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            
        </>
    );
};