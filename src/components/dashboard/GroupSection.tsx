"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "../ui/button"
import { useMutation, useQueryClient } from "react-query"
import { Modal } from "@/features/Modal"
import { useState } from "react"
import { Input } from "../ui/input"
import { Database } from "@/types/supabase"
import { useUserContext } from "@/providers/UserContextProvider"
import { GroupCard } from "./GroupCard"
import { Navbar } from "./Navbar"
import { GroupData } from "@/types/types"

export const GroupSection = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [groupName, setGroupName] = useState("")
    const [groupCity, setGroupCity] = useState("")
    const [groupCountry, setGroupCountry] = useState("")
    const supabase = createClientComponentClient<Database>()
    const queryClient = useQueryClient()
    const { userId } = useUserContext()

    const addGroupData = useMutation(
        async (newGroupData: GroupData[]) => {
            await supabase
                .from("groups")
                .upsert(newGroupData)
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['groups'])
            },
            onError: () => {
                console.log("There was an error creating the group")
            }
        }
    )

    const bodyContent = (
        <div className="flex flex-col gap-4">
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
                addGroupData.mutateAsync([
                    {
                        group_name: groupName,
                        group_city: groupCity,
                        group_country: groupCountry,
                        group_owner: userId
                    }
                ] as GroupData[])
                setIsOpen(false)
            }}>Create group</Button>
        </div>
    )

    return (
        <div className="flex flex-col gap-4">
            <Navbar />
            <div>
                <Button onClick={() => setIsOpen(true)}>Create group</Button>
                <GroupCard />
                <Modal title="Create User"
                    body={bodyContent}
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    onChange={setIsOpen}
                />
            </div>
        </div>
    )
}