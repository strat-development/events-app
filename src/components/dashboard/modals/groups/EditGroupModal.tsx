"use client"

import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { GroupTopicsModalStep } from "@/features/create-group-modal/GroupTopicsModalStep";
import { GroupDescriptionModalStep } from "@/features/create-group-modal/GroupDescriptionModalStep";
import { useGroupDataContext } from "@/providers/GroupDataModalProvider";
import { Modal } from "@/features/Modal";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { Edit, Save } from "lucide-react";

interface EditGroupDialogProps {
    groupId: string;
}

export const EditGroupDialog = ({ groupId }: EditGroupDialogProps) => {
    const supabase = createClientComponentClient<Database>()
    const queryClient = useQueryClient()

    const [isOpen, setIsOpen] = useState(false)
    const [modalStepCount, setModalStepCount] = useState(1)
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
            .eq('id', groupId)

        if (error) {
            throw error
        }
    },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['groups']);
                toast({
                    title: "Success",
                    description: "Group edited successfully",
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
                    description: "There was an error editing the group"
                });
            }
        })


    const bodyContent = (
        <div className="flex flex-col gap-4">
            {modalStepCount === 1 && (
                <>
                    <div className="flex flex-col gap-4">
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
                    </div>

                    <Button onClick={() => {
                        setModalStepCount(2)
                    }}>Next step</Button>
                </>
            )}

            {modalStepCount === 2 && (
                <>
                    <div className="flex flex-col gap-4">
                        <GroupTopicsModalStep />
                        <div className="flex gap-4">
                            <Button onClick={() => setModalStepCount(1)}>Previous step</Button>
                            <Button onClick={() => setModalStepCount(3)}>Next step</Button>
                        </div>

                    </div>
                </>
            )}

            {modalStepCount === 3 && (
                <div className="flex flex-col gap-4">
                    <GroupDescriptionModalStep />

                    <div className="flex">
                        <Button onClick={() => {
                            setModalStepCount(2)
                        }}>Previous step</Button>
                        {selectedInterests.length > 0 && editorContent.length > 0 && groupCity.length > 0 && groupCountry.length > 0 && groupName.length > 0 && (
                            <Button variant="ghost"
                                className="text-blue-500"
                                onClick={() => {
                                    editGroupMutation.mutateAsync()
                                    setIsOpen(false)
                                }}><Save size={20} />
                            </Button>
                        )}
                    </div>

                </div>
            )}
        </div >
    )

    return (
        <>
            <div className="flex flex-col gap-4">
                <Button variant="ghost"
                    className="text-white/70"
                    onClick={() => setIsOpen(true)}>
                    <Edit size={20} />
                </Button>

                <Modal title="Create Group"
                    body={bodyContent}
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    onChange={setIsOpen}
                />
            </div>

            <Toaster />
        </>
    );
};