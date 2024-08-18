import { Database } from "@/types/supabase"
import { GroupData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { useState } from "react"
import { useQuery, useQueryClient } from "react-query"

export const GroupCard = () => {
    const supabase = createClientComponentClient<Database>()
    const [groupData, setGroupData] = useState<GroupData[]>()
    const queryClient = useQueryClient()

    useQuery(['groups'], async () => {
        const { data, error } = await supabase
            .from("groups")
            .select("*")
        if (error) {
            throw error
        }

        if (data) {
            setGroupData(data)
            queryClient.invalidateQueries(['groups'])
        }
    })

    return (
        <div className="flex flex-col gap-4">
            {groupData?.map((group) => (
                <Link href={`/dashboard/group-page-editor/${group.id}`} key={group.id}>
                    <div key={group.id} className="bg-white p-4 rounded-md shadow-md">
                        <h1>{group.group_name}</h1>
                        <p>{group.group_city}</p>
                        <p>{group.group_country}</p>
                    </div>
                </Link>
            ))}
        </div>
    )
}