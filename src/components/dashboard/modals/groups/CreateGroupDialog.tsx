import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GroupDescriptionModalStep } from '@/features/create-group-modal/GroupDescriptionModalStep';
import { GroupTopicsModalStep } from '@/features/create-group-modal/GroupTopicsModalStep';
import { useState } from 'react';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
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

export const CreateGroupDialog = () => {
    const supabase = createClientComponentClient<Database>();
    const [isOpen, setIsOpen] = useState(false);
    const [modalStepCount, setModalStepCount] = useState(1);
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
            setModalStepCount(1);
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
                    <Button className="bg-transparent w-fit" variant="outline">Create Group</Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create Group</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to create a new group.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4">
                        {modalStepCount === 1 && (
                            <>
                                <Input
                                    placeholder="Group Name"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                />
                                <Input
                                    placeholder="Group City"
                                    value={groupCity}
                                    onChange={(e) => setGroupCity(e.target.value)}
                                />
                                <Input
                                    placeholder="Group Country"
                                    value={groupCountry}
                                    onChange={(e) => setGroupCountry(e.target.value)}
                                />
                                <Button className='w-fit' onClick={() => setModalStepCount(2)}>Next step</Button>
                            </>
                        )}

                        {modalStepCount === 2 && (
                            <>
                                <GroupTopicsModalStep />
                                <div className="flex justify-between gap-4">
                                    <Button className='w-fit' onClick={() => setModalStepCount(1)}>Previous step</Button>
                                    <Button className='w-fit' onClick={() => setModalStepCount(3)}>Next step</Button>
                                </div>
                            </>
                        )}

                        {modalStepCount === 3 && (
                            <>
                                <GroupDescriptionModalStep />
                                <div className="flex justify-between gap-4">
                                    <Button className='w-fit' onClick={() => setModalStepCount(2)}>Previous step</Button>
                                    <Button className='w-fit' onClick={() => setModalStepCount(4)}>Next step</Button>
                                </div>
                            </>
                        )}
                        {modalStepCount === 4 && (
                            <>
                                <FileUpload
                                    onChange={(selectedFiles) => {
                                        setFiles(selectedFiles);
                                    }}
                                />
                                <div className="flex justify-between gap-4">
                                    <Button className='w-fit' onClick={() => setModalStepCount(2)}>Previous step</Button>
                                    {selectedInterests.length > 0 && editorContent.length > 0 && groupCity.length > 0 && groupCountry.length > 0 && groupName.length > 0 && files.length == 1 && (
                                        <HoverBorderGradient
                                            onClick={() => {
                                                createGroupMutation.mutateAsync();
                                            }}>
                                            Create group
                                        </HoverBorderGradient>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
