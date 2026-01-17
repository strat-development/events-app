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
            <div className="flex flex-col gap-6 sticky top-24 w-full">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h2 className='text-2xl tracking-wider font-bold mb-6 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent'>
                        Group members
                    </h2>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
                        {memoizedGroupMembers.slice(0, 4).map((member) => (
                            <div 
                                key={member?.id}
                                className='group flex flex-col cursor-pointer items-center bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 p-4 rounded-xl text-center transition-all duration-300 hover:scale-105 hover:shadow-lg'
                                onClick={() => {
                                    setIsSidebarOpen(true);
                                    setIsOpen(true);
                                    setSelectedUser(member as UserData);
                                    setSelectedUserImageUrl(member ? memoizedProfileImages[member.id] : null);
                                }}>
                                <div className="relative mb-3">
                                    {member?.id && memoizedProfileImages[member.id] ? (
                                        <Image
                                            className="rounded-full aspect-square object-cover ring-2 ring-white/10 group-hover:ring-white/30 transition-all"
                                            src={memoizedProfileImages[member.id]}
                                            width={64}
                                            height={64}
                                            alt="Profile image"
                                        />
                                    ) : (
                                        <div className="flex h-[64px] w-[64px] flex-col gap-2 items-center justify-center rounded-full bg-white/5 ring-2 ring-white/10 group-hover:ring-white/30 transition-all">
                                            <IconGhost2Filled className="w-8 h-8 text-white/70" strokeWidth={1} />
                                        </div>
                                    )}
                                </div>
                                <span className='font-medium w-full text-white/90 group-hover:text-white truncate text-sm transition-colors'>
                                    {member?.full_name}
                                </span>
                            </div>
                        ))}
                    </div>
                        
                    {memoizedGroupMembers && memoizedGroupMembers.length > 4 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <GroupMembersDialog 
                                membersData={memoizedGroupMembers}
                                groupData={groupData}
                                imageUrls={memoizedProfileImages} 
                            />
                        </div>
                    )}
                </div>
            </div>

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