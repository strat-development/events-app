import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";

export const UserGroupsSection = () => {
    const supabase = createClientComponentClient<Database>();
    const { userId } = useUserContext();
    const [groupId, setGroupId] = useState<string[]>([]);
    const [imageUrls, setImageUrls] = useState<{ publicUrl: string }[]>([]);

    const fetchGroupId = useQuery(
        'groupIds',
        async () => {
            const { data, error } = await supabase
                .from('group-members')
                .select('group_id')
                .eq('member_id', userId);

            if (error) {
                console.error('Error fetching group ids:', error);
                throw new Error(error.message);
            }

            if (data) {
                setGroupId(data.map((group) => group.group_id as string));
            }

            return data;
        },
        {
            enabled: !!userId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    const fetchGroups = useQuery(
        ['user-groups-data', groupId],
        async () => {
            const { data, error } = await supabase
                .from('groups')
                .select('*')
                .in('id', groupId);

            if (error) {
                console.error('Error fetching groups:', error);
                throw new Error(error.message);
            }

            return data;
        },
        {
            enabled: !!groupId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    const { data: images, isLoading } = useQuery(
        ['group-pictures', groupId],
        async () => {
            const { data, error } = await supabase
                .from('group-pictures')
                .select('*')
                .eq('group_id', groupId)
            if (error) {
                throw error;
            }
            return data || [];
        },
        {
            enabled: !!groupId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    useEffect(() => {
        if (images) {
            Promise.all(images.map(async (image) => {
                const { data: publicURL } = await supabase.storage
                    .from('group-pictures')
                    .getPublicUrl(image.hero_picture_url || "")

                return { publicUrl: publicURL.publicUrl };

            }))
                .then((publicUrls) => setImageUrls(publicUrls))
                .catch(console.error);
        }
    }, [images]);

    const memoizedGroupsData = useMemo(() => fetchGroups.data, [fetchGroups.data]);
    const memoizedImageUrls = useMemo(() => imageUrls, [imageUrls]);

    return (
        <div className="flex flex-col gap-16 w-fit">
            {memoizedGroupsData?.map((group) => (
                <div key={group.id} className="bg-white p-4 rounded-md shadow-md">
                    <Link href={`/group-page/${group.id}`}>
                        <div className="flex gap-4">
                            <div className="flex flex-col gap-4">
                                {memoizedImageUrls.map((image) => (
                                    <Image key={image.publicUrl}
                                        src={image.publicUrl}
                                        alt=""
                                        width={200}
                                        height={200}
                                    />
                                ))}
                            </div>
                            <div className="flex flex-col gap-4">
                                <h1 className="text-2xl font-bold">{group.group_name}</h1>
                                <p>{group.group_country}</p>
                                <p>{group.group_city}</p>
                            </div>
                        </div>
                    </Link>
                </div>
            ))}
        </div>
    );
}