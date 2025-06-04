"use client"

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { useGroupDataContext } from "@/providers/GroupDataModalProvider";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { FileUpload } from "@/components/ui/file-upload";
import { supabaseAdmin } from "@/lib/admin";
import { Edit } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TextEditor } from "@/features/TextEditor";
import { GroupTopicsModalStep } from "@/features/create-group-modal/GroupTopicsModalStep";
import { GenerateDescriptionDialog } from "../events/GenerateDescriptionDialog";

interface EditGroupDialogProps {
    groupId: string;
}

export const EditGroupDialog = ({ groupId }: EditGroupDialogProps) => {
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const { groupName,
        setGroupName,
        groupCity,
        setGroupCity,
        groupCountry,
        setGroupCountry,
        editorContent,
        setEditorContent,
        selectedInterests,
        setSelectedInterests
    } = useGroupDataContext();

    const formattedInterests = { interests: selectedInterests.map((interest) => ({ name: interest })) };

    const editGroupMutation = useMutation(async () => {
        const { data, error } = await supabase
            .from("groups")
            .update({
                group_name: groupName,
                group_city: groupCity,
                group_country: groupCountry,
                group_description: editorContent,
                group_topics: formattedInterests,
            })
            .eq('id', groupId);

        if (error) {
            throw error;
        }

        if (files.length > 0) {
            const paths = await uploadFiles(files);
            await addGroupPicture.mutateAsync(paths);
        }

        return data;
    },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['groups']);
                toast({
                    title: "Success",
                    description: "Group edited successfully",
                });

                setIsOpen(false);
                setGroupName("");
                setGroupCity("");
                setGroupCountry("");
                setEditorContent("");
                setSelectedInterests([]);
                setFiles([]);
            },

            onError: () => {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "There was an error editing the group"
                });
            }
        });

    const addGroupPicture = useMutation(
        async (paths: string[]) => {
            const results = await Promise.all(paths.map(async (path) => {
                const { data, error } = await supabase
                    .from('group-pictures')
                    .upsert({
                        group_id: groupId,
                        hero_picture_url: path
                    }, { onConflict: 'group_id' });

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
            return { promise: supabaseAdmin.storage.from('group-pictures').upload(path, file), path };
        });

        const responses = await Promise.all(uploadPromises.map(({ promise }) => promise));

        responses.forEach((response, index) => {
            if (response.error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: `Error uploading file ${files[index].name}`
                });
            } else {
                toast({
                    title: "Success",
                    description: `File ${files[index].name} uploaded successfully`
                });
            }
        });

        return uploadPromises.map(({ path }) => path);
    };

    const { data: images, isLoading } = useQuery(
        ['group-pictures', groupId],
        async () => {
            const { data, error } = await supabase
                .from('group-pictures')
                .select('*')
                .eq('group_id', groupId);
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
                    <Button variant="outline">
                        <Edit className="text-white/70" size={20} strokeWidth={1} />
                    </Button>
                </DialogTrigger>
                <DialogContent className="flex w-full max-w-[100vw] h-screen rounded-none bg-transparent">
                    <div className="relative flex flex-row max-[900px]:flex-col max-[900px]:items-center items-start overflow-y-auto justify-center w-full gap-16 mt-8">
                        <FileUpload className="max-[900px]:mt-[672px]"
                            onChange={(selectedFiles) => {
                                setFiles(selectedFiles);
                            }}
                        />
                        <div className="flex flex-col gap-4 max-w-[480px]">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-4">
                                    <Input
                                        className="p-0 placeholder:text-white/60 bg-transparent border-none text-2xl outline-none"
                                        placeholder="Group Name"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                    />
                                    <div className='flex max-[900px]:flex-col gap-4'>
                                        <Input
                                            className="p-0 placeholder:text-white/60 bg-transparent border-none text-2xl outline-none"
                                            placeholder="Group City"
                                            value={groupCity}
                                            onChange={(e) => setGroupCity(e.target.value)}
                                        />
                                        <Input
                                            className="p-0 placeholder:text-white/60 bg-transparent border-none text-2xl outline-none"
                                            placeholder="Group Country"
                                            value={groupCountry}
                                            onChange={(e) => setGroupCountry(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <GroupTopicsModalStep />
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-4 items-end max-w-[400px]">
                                        <TextEditor {
                                            ...{
                                                editorContent: editorContent,
                                                onChange: setEditorContent
                                            }
                                        } />
                                        <GenerateDescriptionDialog />
                                    </div>

                                    {selectedInterests.length > 0 && editorContent.length > 0 && groupCity.length > 0 && groupCountry.length > 0 && groupName.length > 0 && (
                                        <HoverBorderGradient
                                            className="w-full"
                                            onClick={() => {
                                                editGroupMutation.mutateAsync();
                                                setIsOpen(false);
                                            }}
                                        >
                                            Update Group
                                        </HoverBorderGradient>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            
        </>
    );
};