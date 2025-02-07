import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useQuery } from "react-query"

interface GroupMembersSidebarProps {
    groupId: string
}

export const GroupMembersSidebar = ({ groupId }: GroupMembersSidebarProps) => {
    const supabase = createClientComponentClient<Database>()
    const [membersId, setMembersId] = useState<string[]>()
    const [profileImageUrls, setProfileImageUrls] = useState<{ publicUrl: string }[]>([]);

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
                .select('*')
                .in('user_id', membersId || [])
            if (error) {
                throw error;
            }
            return data || [];
        },
        { enabled: !!membersId, cacheTime: 10 * 60 * 1000 }
    );

    useEffect(() => {
        if (profileImages) {
            Promise.all(profileImages.map(async (image) => {
                const { data: publicURL } = await supabase.storage
                    .from('profile-pictures')
                    .getPublicUrl(image.image_url)

                return { user_id: image.user_id, publicUrl: publicURL.publicUrl };
            }))
                .then((publicUrls) => setProfileImageUrls(publicUrls.filter(url => url.user_id !== null) as { user_id: string; publicUrl: string }[]))
                .catch(console.error);
        }
    }, [profileImages]);

    const memoizedGroupMembers = useMemo(() => groupMembers.data, [groupMembers.data]);

    return (
        <>
            <div className="flex flex-col gap-4 sticky top-24">
                <h2 className='text-2xl tracking-wider font-bold'>Group members</h2>
                <div className="flex items-start gap-4">
                    <div className='grid gap-4 grid-cols-4'>
                        {memoizedGroupMembers?.slice(0, 12).map((member) => (
                            <Link href={`/user-profile/${member.users?.id}`} key={member.users?.id}>
                                <Image className="rounded-full border border-white/10"
                                    src={profileImageUrls[0]?.publicUrl} 
                                    width={64} 
                                    height={64} 
                                    alt="" 
                                    priority />
                            </Link>
                        ))}
                    </div>
                    {memoizedGroupMembers && memoizedGroupMembers?.length > 3 && (
                        <Link className="text-white/70"
                            href={`/group-members/${groupId}`}>
                            More
                        </Link>
                    )}
                </div>
            </div>
        </>
    )
}