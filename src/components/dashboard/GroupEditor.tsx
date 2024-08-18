"use client"

import { Database } from "@/types/supabase"
import { GroupData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState } from "react"
import { useQuery } from "react-query"

export const GroupEditor = () => {
    const supabase = createClientComponentClient<Database>()
    const [groupData, setGroupData] = useState<GroupData[]>()

    useQuery(['groups'], async () => {
        const { data, error } = await supabase
            .from("groups")
            .select("*")
        if (error) {
            throw error
        }

        if (data) {
            setGroupData(data)
        }
    })


    return (
        <div className="flex flex-col gap-4">
            {groupData?.map((group) => (
                <div key={group.id} className="bg-white p-4 rounded-md shadow-md">
                    <h1>{group.group_name}</h1>
                    <p>{group.group_city}</p>
                    <p>{group.group_country}</p>
                </div>
            ))}
        </div>
    )
}