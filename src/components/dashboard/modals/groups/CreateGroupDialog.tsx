import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GroupTopicsModalStep } from '@/features/create-group-modal/GroupTopicsModalStep';
import { useState } from 'react';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
} from '@/components/ui/dialog';
import { useGroupDataContext } from '@/providers/GroupDataModalProvider';
import { useUserContext } from '@/providers/UserContextProvider';
import { useMutation } from 'react-query';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { toast } from '@/components/ui/use-toast';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { FileUpload } from '@/components/ui/file-upload';
import { supabaseAdmin } from '@/lib/admin';
import { GroupData } from '@/types/types';
import { Plus, X } from 'lucide-react';
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { TextEditor } from '@/features/TextEditor';
import { GenerateDescriptionDialog } from '../events/GenerateDescriptionDialog';

export const CreateGroupDialog = () => {
    const supabase = createClientComponentClient<Database>();
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
    const { userId } = useUserContext();

    const formattedInterests = { interests: selectedInterests.map((interest) => ({ name: interest })) };

    const createGroupMutation = useMutation<GroupData>(async () => {
        const { data, error } = await supabase
            .from("groups")
            .insert([{
                group_name: groupName,
                group_city: groupCity,
                group_country: groupCountry,
                group_description: editorContent,
                group_topics: formattedInterests,
                group_owner: userId
            }])
            .select();

        if (error) {
            throw new Error(error.message || "Error creating group");
        }

        if (!data || data.length === 0) {
            throw new Error("No data returned from the database");
        }

        return data[0];
    }, {
        onSuccess: async (groupData) => {
            const groupId = groupData.id;

            if (files.length > 0) {
                try {
                    const paths = await uploadFiles(files);
                    await addGroupPicture.mutateAsync({ paths, groupId });

                    toast({
                        title: "Success",
                        description: "Group and images created successfully",
                    });
                } catch (error) {
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: `Error uploading image(s)`,
                    });
                }
            } else {
                toast({
                    title: "Success",
                    description: "Group created successfully without images",
                });
            }

            setIsOpen(false);
            setGroupName("");
            setGroupCity("");
            setGroupCountry("");
            setEditorContent("");
            setSelectedInterests([]);
            setFiles([]);
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: `There was an error creating the group`,
            });
        }
    });


    const addGroupPicture = useMutation(async ({ paths, groupId }: { paths: string[], groupId: string }) => {
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
    });

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

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button
                        className="flex flex-col items-center justify-center w-[280px] h-[360px] rounded-xl bg-transparent hover:bg-white/5 transition-all duration-300"
                        variant="ghost">
                        <div className="flex flex-col items-center">
                            <div className="text-6xl text-white/70">
                                <Plus size={128} />
                            </div>
                            <p className="text-xl tracking-wide text-white/50 font-medium">Create new group</p>
                        </div>
                    </Button>
                </DialogTrigger>
                <DialogContent className="flex w-full max-w-[100vw] h-screen rounded-none bg-transparent">
                    <div className="relative flex flex-row max-[900px]:flex-col max-[900px]:items-center items-start h-full overflow-y-auto justify-center w-full gap-16 mt-8">
                        <FileUpload className="max-[900px]:mt-[600px]"
                            onChange={(selectedFiles) => {
                                setFiles(selectedFiles);
                            }}
                        />
                        <div className="flex flex-col gap-4 max-w-[480px]">
                            <Input
                                className="placeholder:text-white/60 bg-transparent border-none text-2xl outline-none"
                                placeholder="Group Name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />
                            <div className='flex max-[900px]:flex-col gap-4'>
                                <Input
                                    className="placeholder:text-white/60 bg-transparent border-none text-2xl outline-none"
                                    placeholder="Group City"
                                    value={groupCity}
                                    onChange={(e) => setGroupCity(e.target.value)}
                                />
                                <Input
                                    className="placeholder:text-white/60 bg-transparent border-none text-2xl outline-none"
                                    placeholder="Group Country"
                                    value={groupCountry}
                                    onChange={(e) => setGroupCountry(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-4 items-end max-w-[400px]">
                                <TextEditor {
                                    ...{
                                        editorContent: editorContent,
                                        onChange: setEditorContent
                                    }
                                } />
                                <GenerateDescriptionDialog />
                            </div>
                            <GroupTopicsModalStep />
                            <div className="flex justify-between gap-4">
                                {groupName && editorContent && groupCity && groupCountry && selectedInterests.length > 0 && files.length > 0 && (
                                    <HoverBorderGradient className="w-full"
                                        onClick={() => {
                                            createGroupMutation.mutateAsync();
                                        }}
                                    >
                                        Create Group
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

