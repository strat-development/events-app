import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GroupDescriptionModalStep } from '@/features/create-group-modal/GroupDescriptionModalStep';
import { GroupTopicsModalStep } from '@/features/create-group-modal/GroupTopicsModalStep';
import { useState } from 'react';
import { Dialog, 
    DialogTrigger, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
} from '@/components/ui/dialog';
import { useGroupDataContext } from '@/providers/GroupDataModalProvider';
import { useUserContext } from '@/providers/UserContextProvider';
import { useMutation, useQueryClient } from 'react-query';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { toast } from '@/components/ui/use-toast';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

export const CreateGroupDialog = () => {
    const supabase = createClientComponentClient<Database>()
    const queryClient = useQueryClient()
    const [isOpen, setIsOpen] = useState(false);
    const [modalStepCount, setModalStepCount] = useState(1);
    
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
    } = useGroupDataContext()
    const { userId } = useUserContext()
    
    const formattedInterests = { interests: selectedInterests.map((interest) => ({ name: interest })) };

    const createGroupMutation = useMutation(async () => {
        const { data, error } = await supabase
            .from("groups")
            .insert([
                {
                    group_name: groupName,
                    group_city: groupCity,
                    group_country: groupCountry,
                    group_description: editorContent,
                    group_topics: formattedInterests,
                    group_owner: userId
                }
            ])

        if (error) {
            throw error
        }
    },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['groups']);
                toast({
                    title: "Success",
                    description: "Group created successfully",
                });

                setIsOpen(false);
                setModalStepCount(1);
                setGroupName("");
                setGroupCity("");
                setGroupCountry("");
                setEditorContent("");
                setSelectedInterests([]);
            },

            onError: () => {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "There was an error creating the group"
                });
            }
        })


    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-transparent" 
                    variant="outline">Create Group</Button>
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
                                <Button onClick={() => setModalStepCount(2)}>Next step</Button>
                            </>
                        )}

                        {modalStepCount === 2 && (
                            <>
                                <GroupTopicsModalStep />
                                <div className="flex gap-4">
                                    <Button onClick={() => setModalStepCount(1)}>Previous step</Button>
                                    <Button onClick={() => setModalStepCount(3)}>Next step</Button>
                                </div>
                            </>
                        )}

                        {modalStepCount === 3 && (
                            <>
                                <GroupDescriptionModalStep />
                                <div className="flex gap-4">
                                    <Button onClick={() => setModalStepCount(2)}>Previous step</Button>
                                    {selectedInterests.length > 0 && editorContent.length > 0 && groupCity.length > 0 && groupCountry.length > 0 && groupName.length > 0 && (
                                        <HoverBorderGradient 
                                        onClick={() => {
                                            createGroupMutation.mutateAsync()
                                            setIsOpen(false);
                                        }}>Create group</HoverBorderGradient>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}