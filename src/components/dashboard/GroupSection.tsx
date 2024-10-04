"use client"

import { Button } from "../ui/button"
import { Modal } from "@/features/Modal"
import { useState } from "react"
import { Input } from "../ui/input"
import { GroupCard } from "./GroupCard"
import { Navbar } from "./Navbar"
import { GroupTopicsModalStep } from "@/features/create-group-modal/GroupTopicsModalStep"
import { GroupDescriptionModalStep } from "@/features/create-group-modal/GroupDescriptionModalStep"
import { useGroupDataContext } from "@/providers/GroupDataModalProvider"
import { useMutation, useQueryClient } from "react-query"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/supabase"
import { Toaster } from "../ui/toaster"
import { toast } from "../ui/use-toast"
import { useUserContext } from "@/providers/UserContextProvider"

export const GroupSection = () => {
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
        selectedInterests
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

            },

            onError: () => {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "There was an error creating the group"
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
                            <Button onClick={() => {
                                createGroupMutation.mutateAsync()
                                setIsOpen(false)
                            }}>Create group</Button>
                        )}
                    </div>

                </div>
            )}
        </div >
    )

    return (
        <>
            <div className="flex flex-col gap-4">
                <Navbar />
                <div>
                    <Button onClick={() => setIsOpen(true)}>Create group</Button>
                    <GroupCard />
                    <Modal title="Create Group"
                        body={bodyContent}
                        isOpen={isOpen}
                        onClose={() => setIsOpen(false)}
                        onChange={setIsOpen}
                    />
                </div>
            </div>

            <Toaster />
        </>
    )
}