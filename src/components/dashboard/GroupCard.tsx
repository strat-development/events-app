import { Database } from "@/types/supabase"
import { GroupData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { useState } from "react"
import { useQuery, useQueryClient } from "react-query"
import { DeleteGroupDialog } from "./modals/DeleteGroupDialog"
import { EditGroupDialog } from "./modals/EditGroupModal"

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
                <div key={group.id} className="bg-white p-4 rounded-md shadow-md">
                    <Link href={`/dashboard/group-page/${group.id}`} key={group.id}>
                        <h1>{group.group_name}</h1>
                        <p>{group.group_city}</p>
                        <p>{group.group_country}</p>
                    </Link>
                    <div className="flex gap-4">
                        <EditGroupDialog groupId={group.id} />
                        <DeleteGroupDialog groupId={group.id} />
                    </div>

                </div>
            ))}
        </div>
    )
}