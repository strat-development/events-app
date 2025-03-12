"use client"

import { Button } from "@/components/ui/button";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { IconGhost2Filled } from "@tabler/icons-react";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import GridLoader from "react-spinners/GridLoader";

export default function GroupMembersPage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const groupId = params.slug;
    const supabase = createClientComponentClient<Database>()
    const [groupMembersId, setGroupMembersId] = useState<string[]>([])
    const [profileImageUrls, setProfileImageUrls] = useState<Record<string, string>>({});
    const router = useRouter();
    const { userId, loading } = useUserContext();

    useEffect(() => {
        if (!loading && userId === null) {
            router.push('/');
        }
    }, [loading, userId, router]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <GridLoader className="opacity-50" color="#fff" size={24} margin={2} />
            </div>
        )
    }

    const groupData = useQuery(
        ['group-data'],
        async () => {
            const { data, error } = await supabase
                .from("groups")
                .select(`
                *
                `)
                .eq("id", groupId)

            if (error) {
                throw new Error(error.message)
            }

            return data
        },
        {
            enabled: !!groupId,
            cacheTime: 10 * 60 * 1000,
        })

    const groupMembers = useQuery(
        ['group-members-data'],
        async () => {
            const { data, error } = await supabase
                .from("group-members")
                .select(`users (*)`)
                .eq("group_id", groupId)

            if (error) {
                throw new Error(error.message)
            }

            if (data) {
                setGroupMembersId(data.map((member) => member.users?.id as string))
            }
            return data
        },
        {
            enabled: !!groupId,
            cacheTime: 10 * 60 * 1000,
        })

    const { data: profileImages } = useQuery(['profile-pictures', groupMembersId], async () => {
        const { data, error } = await supabase
            .from('profile-pictures')
            .select('user_id, image_url')
            .in('user_id', groupMembersId);

        if (error) {
            throw error;
        }

        const urlMap: Record<string, string> = {};
        if (data) {
            await Promise.all(
                data.map(async (image) => {
                    const { data: publicURL } = await supabase.storage
                        .from('profile-pictures')
                        .getPublicUrl(image.image_url);
                    if (publicURL && image.user_id) urlMap[image.user_id] = publicURL.publicUrl;
                })
            );
            setProfileImageUrls(urlMap);
        }
        return urlMap;
    }, {
        enabled: groupMembersId.length > 0,
        cacheTime: 10 * 60 * 1000,
    });

    const memoizedGroupMembersData = useMemo(() => groupMembers, [groupMembers])
    const memoizedProfileImages = useMemo(() => profileImageUrls, [profileImageUrls])

    return (
        <div className="pt-24 flex flex-col gap-8 max-w-[1200px] w-full justify-self-center">
            <div className="flex flex-col gap-1">
                <p className="text-white/70">Event attendees for </p>
                {groupData.data?.map((group, index) => (
                    <div key={index}
                        className="flex flex-col gap-2">
                        <div className="flex gap-2 items-end">
                            <h2 key={group.id}
                                className="text-2xl tracking-wider font-bold">{group.group_name}</h2>
                            <p className="text-white/60">({memoizedGroupMembersData.data?.length} in total)</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex gap-2">
                                <MapPin strokeWidth={1}
                                    size={24} />
                                <p className="text-white/60">{group.group_city}, </p>
                                <p className="text-white/60">{group.group_country}</p>
                            </div>
                        </div>
                    </div>
                ))}

            </div>
            <div className="flex flex-wrap gap-8 max-[640px]:justify-center">
                {memoizedGroupMembersData.data?.map((member) => (
                    <div key={member.users?.id}
                        className="flex flex-col gap-4 border border-white/10 p-4 rounded-xl max-w-[196px] w-full">
                        <div className="flex flex-col items-center justify-center gap-4 border rounded-xl border-white/10 aspect-square">
                            {member.users?.id && memoizedProfileImages && memoizedProfileImages[member.users.id] ? (
                                <Image
                                    src={memoizedProfileImages[member.users.id]}
                                    alt="profile picture"
                                    width={2000}
                                    height={2000}
                                    objectFit="cover"
                                    className='rounded-xl'
                                />
                            ) : (
                                <div className="flex w-full h-full flex-col gap-2 items-center text-center justify-center rounded-xl bg-white/5">
                                    <IconGhost2Filled className="w-16 h-16 text-white/70" strokeWidth={1} />
                                    <p className="text-white/50 text-sm">Profile picture not available</p>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <p className="text-xl font-bold tracking-wider line-clamp-1 text-center">{member.users?.full_name}</p>
                            <Button onClick={() => router.push(`/user-profile/${member.users?.id}`)}>
                                View Profile
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}