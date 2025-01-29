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
import { usePathname } from "next/navigation"

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
    const pathname = usePathname()

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
    },
        {
            cacheTime: 10 * 60 * 1000,
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
    },
        {
            cacheTime: 10 * 60 * 1000,
        })

    return (
        <>
            <div className="flex flex-col gap-8 max-w-[1200px] w-full justify-self-center">
                <div className="flex flex-col gap-4 px-8">
                    <h2 className='text-xl font-bold tracking-wider'>Little bit about us</h2>
                    <div className='relative'>
                        {isSetToEdit === false && (
                            <>
                                <div
                                    dangerouslySetInnerHTML={{ __html: groupDescription as string }}
                                    className={`overflow-hidden ${isExpanded ? 'max-h-full' : 'max-h-24'} ${!isExpanded && 'blur-effect'}`}></div>
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
                                    <div className="flex gap-4">
                                        <Button className="w-fit"
                                            onClick={() => {
                                                editGroupDescriptionMutation.mutate(groupDescription as string)

                                                setIsSetToEdit(false)
                                            }}>
                                            Save changes
                                        </Button>
                                        <Button className="w-fit"
                                            variant="outline"
                                            onClick={() => setIsSetToEdit(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                    </div>
                    {pathname.includes("/dashboard") && userId === ownerId && !isSetToEdit && (
                        <div className="flex gap-4">
                            <Button onClick={() => setIsSetToEdit(true)}>
                                Edit
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <Toaster />
        </>
    )
}