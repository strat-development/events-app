"use client"

import { Button } from "@/components/ui/button"
import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { TextEditor } from "../TextEditor"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import { useUserContext } from "@/providers/UserContextProvider"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider"

interface GroupInfoSectionProps {
    groupId: string
}

export const GroupInfoSection = ({ groupId }: GroupInfoSectionProps) => {
    const supabase = createClientComponentClient<Database>()
    const [groupDescription, setGroupDescription] = useState<string>()
    const [isExpanded, setIsExpanded] = useState(false)
    const [isSetToEdit, setIsSetToEdit] = useState(false)
    const queryClient = useQueryClient()
    const { userId } = useUserContext()
    const { ownerId } = useGroupOwnerContext()

    useQuery(['groups-description'], async () => {
        const { data, error } = await supabase
            .from("groups")
            .select("group_description")
            .eq("id", groupId)

        if (error) {
            throw error
        }

        if (data) {
            setGroupDescription(data[0].group_description as string)
        }
    })

    const groupMembers = useQuery(
        ['group-members-data'],
        async () => {
            const { data, error } = await supabase
                .from("group-members")
                .select(`
                users (
                    *
                )`)
                .eq("group_id", groupId)

            if (error) {
                throw new Error(error.message)
            }

            return data
        },
        {
            enabled: !!groupId,
        })

    const editGroupDescriptionMutation = useMutation(
        async (newGroupDescription: string) => {
            const { data, error } = await supabase
                .from("groups")
                .update({ group_description: newGroupDescription })
                .eq("id", groupId)

            if (error) {
                throw error
            }

            if (data) {
                setIsSetToEdit(false)
            }
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('groups')
                toast({
                    title: "Success",
                    description: "Description updated successfully",
                });
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to update description",
                    variant: "destructive"
                });
            }
        })

    return (
        <>
            <div className="flex gap-8">
                <div className="flex flex-col gap-4">
                    <h2 className='text-2xl font-bold'>Little bit about us</h2>
                    <div className='relative'>
                        {isSetToEdit === false && (
                            <>
                                <div
                                    dangerouslySetInnerHTML={{ __html: groupDescription as string }}
                                    className={`overflow-hidden ${isExpanded ? 'max-h-full' : 'max-h-24'} ${!isExpanded && 'blur-effect'}`}
                                ></div>
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className='text-blue-500'>
                                    {isExpanded ? 'Show less' : 'Show more'}
                                </button>
                            </>
                        ) || (

                                <div className="flex flex-col gap-4">
                                    <TextEditor
                                        editorContent={groupDescription as string}
                                        onChange={setGroupDescription}
                                    />
                                    <Button onClick={() => setIsSetToEdit(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={() => {
                                        editGroupDescriptionMutation.mutate(groupDescription as string)

                                        setIsSetToEdit(false)
                                    }}>
                                        Save changes
                                    </Button>
                                </div>
                            )}
                    </div>
                    {userId === ownerId && !isSetToEdit && (
                        <div className="flex gap-4">
                            <Button onClick={() => setIsSetToEdit(true)}>
                                Edit
                            </Button>
                        </div>
                    )}

                </div>
                <div className="flex flex-col gap-4">
                    <h2 className='text-2xl font-bold'>Members</h2>
                    <div className='grid grid-cols-4'>
                        {groupMembers.data?.map((member) => (
                            <div key={member.users?.id} className='flex flex-col gap-2'>
                                <span className='text-sm'>{member.users?.full_name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Toaster />
        </>
    )
}