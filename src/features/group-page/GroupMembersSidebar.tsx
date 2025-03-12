import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { IconGhost2Filled } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useQuery } from "react-query"

interface GroupMembersSidebarProps {
    groupId: string
}

export const GroupMembersSidebar = ({ groupId }: GroupMembersSidebarProps) => {
    const supabase = createClientComponentClient<Database>()
    const [membersId, setMembersId] = useState<string[]>([])
    const [profileImageUrls, setProfileImageUrls] = useState<Record<string, string>>({})

    const groupMembers = useQuery(
        ['group-members-data'],
        async () => {
            const { data, error } = await supabase
                .from("group-members")
                .select(`users (*)`)
                .eq("group_id", groupId)
                .limit(4)

            if (error) {
                throw new Error(error.message)
            }

            if (data) {
                setMembersId(data.map((member) => member.users?.id as string))
            }
            return data
        },
        {
            enabled: !!groupId,
            cacheTime: 10 * 60 * 1000,
        })

    const { data: profileImages } = useQuery(
        ['profile-pictures', membersId],
        async () => {
            const { data, error } = await supabase
                .from('profile-pictures')
                .select('user_id, image_url')
                .in('user_id', membersId)

            if (error) {
                throw error
            }

            const urlMap: Record<string, string> = {}
            if (data) {
                await Promise.all(
                    data.map(async (image) => {
                        const { data: publicURL } = await supabase.storage
                            .from('profile-pictures')
                            .getPublicUrl(image.image_url)
                        if (publicURL && image.user_id) urlMap[image.user_id] = publicURL.publicUrl
                    })
                )
                setProfileImageUrls(urlMap)
            }
            return urlMap
        },
        {
            enabled: membersId.length > 0,
            cacheTime: 10 * 60 * 1000,
        }
    )

    const memoizedGroupMembers = useMemo(() => groupMembers.data, [groupMembers.data])
    const memoizedProfileImages = useMemo(() => profileImageUrls, [profileImageUrls])

    return (
        <>
            <div className="flex flex-col gap-4 sticky top-24">
                <h2 className='text-2xl tracking-wider font-bold'>Group members</h2>
                <div className="flex items-start gap-4">
                    <div className='flex flex-wrap gap-4'>
                        {memoizedGroupMembers?.slice(0, 11).map((member) => (
                            <Link href={`/user-profile/${member.users?.id}`} key={member.users?.id}>
                                <div className='flex flex-col items-center border border-white/10 p-4 rounded-xl text-center w-[144px] h-full'>
                                    {member.users?.id && memoizedProfileImages[member.users.id] ? (
                                        <Image
                                            className="rounded-full"
                                            src={memoizedProfileImages[member.users.id]}
                                            width={50}
                                            height={50}
                                            alt="Profile image"
                                        />
                                    ) : (
                                        <div className="flex h-[50px] w-[50px] flex-col gap-2 items-center justify-center rounded-full bg-white/5">
                                            <IconGhost2Filled className="w-6 h-6 text-white/70" strokeWidth={1} />
                                        </div>
                                    )}
                                    <span className='font-medium w-full text-white/70 truncate'>{member.users?.full_name}</span>
                                </div>
                            </Link>
                        ))}
                        {memoizedGroupMembers && memoizedGroupMembers.length > 11 && (
                            <Link href={`/group-members/${groupId}`}>
                                <div className="flex flex-col relative gap-2 items-center border border-white/10 p-4 rounded-xl text-center w-[144px] h-full">
                                    <Image className="rounded-full blur-sm absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                                        src={memoizedProfileImages[membersId[0]]} width={50} height={50} alt="" />
                                    <span className='text-white/70 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full text-xl tracking-wider font-bold'>+{memoizedGroupMembers.length - 11} more</span>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}