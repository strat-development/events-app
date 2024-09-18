"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider"
import { useUserContext } from "@/providers/UserContextProvider"
import { Database } from "@/types/supabase"
import { GroupData, GroupMembersData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"

interface GroupHeroProps {
    groupId: string
}


export const GroupHero = ({
    groupId
}: GroupHeroProps) => {
    const supabase = createClientComponentClient<Database>()
    const queryClient = useQueryClient()
    const { userId } = useUserContext()
    const { ownerId } = useGroupOwnerContext()

    const [groupData, setGroupData] = useState<GroupData[]>()
    const [groupNameToEdit, setGroupNameToEdit] = useState(false)
    const [newGroupName, setNewGroupName] = useState("")
    const [groupCityToEdit, setGroupCityToEdit] = useState(false)
    const [newGroupCity, setNewGroupCity] = useState("")
    const [newGroupCountry, setNewGroupCountry] = useState("")
    const [groupMembersData, setGroupMembersData] = useState<GroupMembersData[]>()

    useQuery(['groups'], async () => {
        const { data, error } = await supabase
            .from("groups")
            .select("*")
            .eq("id", groupId)
            
        if (error) {
            throw error
        }

        if (data) {
            setGroupData(data)
        }
    })

    const editGroupNameMutation = useMutation(async (newGroupName: string) => {
        const { data, error } = await supabase
            .from("groups")
            .update({ group_name: newGroupName })
            .eq("group_owner", userId)
            .eq("id", groupId)
        if (error) {
            throw error
        }

        if (data) {
            setGroupNameToEdit(false)
        }
    }, {
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Group name changed successfully",
            });

            queryClient.invalidateQueries('groups')
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to change group name",
            });
        }
    })

    const editGroupLocationMutation = useMutation(async () => {
        const { data, error } = await supabase
            .from("groups")
            .update({ group_city: newGroupCity, group_country: newGroupCountry })
            .eq("group_owner", userId)
            .eq("id", groupId)
        if (error) {
            throw error
        }

        if (data) {
            setGroupCityToEdit(false)
        }
    }, {
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Group location changed successfully",
            });

            queryClient.invalidateQueries('groups')
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to change group location",
            });
        }
    })

    useQuery(['group-members'], async () => {
        const { data, error } = await supabase
            .from("group-members")
            .select("*", { count: "exact" })
            .eq("group_id", groupId)

        if (error) {
            throw error
        }

        if (data) {
            setGroupMembersData(data)
        }
    })

    return (
        <>
            <div className="flex flex-col gap-4">
                {groupData?.map((group) => (
                    <div key={group.id} className="bg-white p-4 rounded-md shadow-md">
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-4">
                                <h1>{group.group_name}</h1>
                                {userId === ownerId && !groupNameToEdit && <Button onClick={() => setGroupNameToEdit(true)}>Edit</Button>}
                            </div>
                            <div>
                                {groupNameToEdit && (
                                    <div className="flex gap-4">
                                        <Input placeholder="New group name"
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                        />
                                        <Button onClick={() => setGroupNameToEdit(false)}>Cancel</Button>
                                        <Button onClick={() => {
                                            editGroupNameMutation.mutateAsync(newGroupName)

                                            setGroupNameToEdit(false)
                                        }}>Save</Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex gap-2">
                                <p>{group.group_city},</p>
                                <p>{group.group_country}</p>
                                {userId === ownerId && !groupCityToEdit && <Button onClick={() => setGroupCityToEdit(true)}>Edit</Button>}
                            </div>
                            <div>
                                {groupCityToEdit && (
                                    <div className="flex gap-4">
                                        <Input placeholder="New group city"
                                            value={newGroupCity}
                                            onChange={(e) => setNewGroupCity(e.target.value)}
                                        />
                                        <Input placeholder="New group country"
                                            value={newGroupCountry}
                                            onChange={(e) => setNewGroupCountry(e.target.value)}
                                        />
                                        <Button onClick={() => setGroupCityToEdit(false)}>Cancel</Button>
                                        <Button onClick={() => {
                                            editGroupLocationMutation.mutateAsync()

                                            setGroupCityToEdit(false)
                                        }}>Save</Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            {groupMembersData?.map((member) => (
                                <div key={member.id}>
                                    <p>Members count: {groupMembersData?.length || 0}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <Toaster />
        </>
    )
}