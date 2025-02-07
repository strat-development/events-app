import { Button } from "@/components/ui/button";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
        <div className="flex gap-8 max-w-[440px] w-full min-[1200px]:w-fit overflow-y-auto max-h-[416px]">
            {memoizedGroupsData?.map((group) => (
                <Link key={group.id} href={`/group-page/${group.id}`}>
                    <div key={group.id} className="border rounded-md border-white/10 w-full">
                        <div className="flex w-full gap-4 p-4 h-[116px]">
                            <div className="flex flex-col items-center justify-center gap-4 border rounded-md border-white/10 aspect-video w-[160px] h-fit">
                                {memoizedImageUrls.length > 0 && (
                                    memoizedImageUrls.map((url) => (
                                        <Image
                                            key={url.publicUrl}
                                            src={url.publicUrl}
                                            alt="group image"
                                            width={2000}
                                            height={2000}
                                            objectFit="cover"
                                            className="rounded-md aspect-video w-full h-full"
                                        />
                                    ))
                                ) || (
                                        <div className="w-full h-full flex items-center justify-center bg-white/10 rounded-md">
                                            <p className="text-center font-medium">No image available 😔</p>
                                        </div>
                                    )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <h1 className="text-white/70 text-xl font-bold line-clamp-2 tracking-wider">{group.group_name}</h1>
                                <p className="text-white/50">{group.group_city}, {group.group_country}</p>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}