"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { useState } from "react";
import { TextEditor } from "../../../../features/TextEditor";
import { Toaster } from "@/components/ui/toaster";
import { FileUpload } from "@/components/ui/file-upload";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { toast } from "@/components/ui/use-toast";
import { supabaseAdmin } from "@/lib/admin";
import { Input } from "@/components/ui/input";
import { Plus, Save } from "lucide-react";

interface CreateGroupPostDialogProps {
    groupId: string;
}

export const CreateGroupPostDialog = ({ groupId }: CreateGroupPostDialogProps) => {
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();
    const [modalStepCount, setModalStepCount] = useState(1);
    const [isOpen, setIsOpen] = useState(false);
    const [editorContent, setEditorContent] = useState("");
    const [title, setTitle] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [fullName, setFullName] = useState<string[]>([])
    const [groupName, setGroupName] = useState<string>("")
    const [email, setEmail] = useState<string[]>([])

    const groupData = useQuery(
        ["group", groupId],
        async () => {
            const { data, error } = await supabase
                .from("groups")
                .select("group_name")
                .eq('id', groupId)

            if (error) {
                console.error("Error fetching group data:", error.message)
                throw new Error(error.message)
            }

            if (data) {
                setGroupName(data[0].group_name || "")
            }

            return data
        },
        {
            enabled: isOpen,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
        })

    const membersData = useQuery(
        ["group-members", groupId],
        async () => {
            const { data, error } = await supabase
                .from("group-members")
                .select(`users (id, full_name, email)`)
                .eq("group_id", groupId)


            if (error) {
                console.error("Error fetching attendees data:", error.message)
                throw new Error(error.message)
            }

            if (data) {
                setEmail(data.map((member) => member.users ? member.users.email as string : ""))
                setFullName(data.map((member) => member.users ? member.users.full_name as string : ""))
            }
        }, {
        enabled: isOpen,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    })

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
                <DialogTrigger className="w-full" asChild>
                    <Button className="flex flex-col items-center justify-center w-full h-[280px] rounded-xl bg-transparent hover:bg-white/5 transition-all duration-300"
                        variant="ghost">
                        <div className="flex flex-col items-center">
                            <div className="text-6xl text-white/70">
                                <Plus size={128} />
                            </div>
                            <p className="text-xl tracking-wide text-white/50 font-medium">Create post</p>
                        </div>
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
                                        setFiles(selectedFiles);
                                    }}
                                />

                                <Button className="w-full" onClick={() => setModalStepCount(1)}>
                                    Previous step
                                </Button>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        {editorContent.length > 0 && files.length > 0 && title !== "" && (
                            <Button className="text-blue-500"
                            variant="ghost" 
                            onClick={() => createPost.mutate()}>
                                <Save size={20} />
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </>
    );
};
