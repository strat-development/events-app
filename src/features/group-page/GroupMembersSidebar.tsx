import { GroupMembersDialog } from "@/components/dashboard/modals/groups/GroupMembersDialog"
import { SidebarProvider } from "@/components/ui/sidebar"
import { UserProfileSidebar } from "@/components/UserProfileSidebar"
import { Database } from "@/types/supabase"
import { GroupData, UserData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { IconGhost2Filled } from "@tabler/icons-react"
import Image from "next/image"
import { useMemo, useState } from "react"
import { useQuery } from "react-query"

interface GroupMembersSidebarProps {
    groupId: string
}

export const GroupMembersSidebar = ({ groupId }: GroupMembersSidebarProps) => {
    const supabase = createClientComponentClient<Database>()
    const [membersId, setMembersId] = useState<string[]>([])
    const [profileImageUrls, setProfileImageUrls] = useState<Record<string, string>>({})
    const [isOpen, setIsOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [selectedUserImageUrl, setSelectedUserImageUrl] = useState<string | null>(null);
    const [groupData, setGroupData] = useState<GroupData | null>(null);
    const [membersData, setMembersData] = useState<UserData[]>([]);

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
                setMembersData(data.map((member) => member.users as UserData))
            }

            return data
        },
        {
            enabled: !!groupId,
            cacheTime: 10 * 60 * 1000,
        })

    const fetchGroupData = useQuery(
        ['group-data'],
        async () => {
            const { data, error } = await supabase
                .from("groups")
                .select(`*`)
                .eq("id", groupId)

            if (error) {
                throw new Error(error.message)
            }

            if (data) {
                setGroupData(data[0])
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

    const memoizedGroupMembers = useMemo(() => membersData, [membersData])
    const memoizedProfileImages = useMemo(() => profileImageUrls, [profileImageUrls])

    return (
        <>
            <div className="flex flex-col gap-4 sticky top-24 w-full">
                <h2 className='text-2xl tracking-wider font-bold'>Group members</h2>
                <div className="flex flex-col gap-4">
                    <div className='grid grid-cols-3 gap-4'>
                        {memoizedGroupMembers.slice(0, 4).map((member) => (
                            <div className='flex flex-col cursor-pointer items-center border border-white/10 p-4 rounded-xl text-center w-fit justify-between'
                                onClick={() => {
                                    setIsSidebarOpen(true);
                                    setIsOpen(true);
                                    setSelectedUser(member as UserData);
                                    setSelectedUserImageUrl(member ? memoizedProfileImages[member.id] : null);
                                }}>
                                {member?.id && memoizedProfileImages[member.id] ? (
                                    <Image
                                        className="rounded-full aspect-square object-cover"
                                        src={memoizedProfileImages[member.id]}
                                        width={48}
                                        height={48}
                                        alt="Profile image"
                                    />
                                ) : (
                                    <div className="flex h-[48px] w-[48px] flex-col gap-2 items-center justify-center rounded-full bg-white/5">
                                        <IconGhost2Filled className="w-6 h-6 text-white/70" strokeWidth={1} />
                                    </div>
                                )}
                                <span className='font-medium w-full text-white/70 truncate text-sm'>{member?.full_name}</span>
                            </div>
                        ))}
                        {memoizedGroupMembers && memoizedGroupMembers.length > 1 && (
                            <GroupMembersDialog membersData={memoizedGroupMembers}
                                groupData={groupData}
                                imageUrls={memoizedProfileImages} />
                        )}
                    </div>
                </div>
            </div >



            <SidebarProvider>
                {isSidebarOpen && (
                    <UserProfileSidebar isOpen={isOpen}
                        onClose={() => setIsSidebarOpen(false)}
                        selectedUser={selectedUser}
                        imageUrl={selectedUserImageUrl} />
                )}
            </SidebarProvider>
        </>
    )
}