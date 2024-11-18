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
    const [ownedGroups, setOwnedGroups] = useState<any[]>([]);
    const [memberGroups, setMemberGroups] = useState<any[]>([]);
    const [imageUrls, setImageUrls] = useState<{ [groupId: string]: string }>({});
    const router = useRouter();

    const fetchOwnedGroups = useQuery(
        'ownedGroups',
        async () => {
            const { data, error } = await supabase
                .from('groups')
                .select('*')
                .eq('group_owner', userId);

            if (error) {
                console.error('Error fetching owned groups:', error);
                throw new Error(error.message);
            }

            setOwnedGroups(data);
            return data;
        },
        {
            enabled: !!userId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    const fetchMemberGroups = useQuery(
        'memberGroups',
        async () => {
            const { data, error } = await supabase
                .from('group-members')
                .select('group_id')
                .eq('member_id', userId);

            if (error) {
                console.error('Error fetching member groups:', error);
                throw new Error(error.message);
            }

            const groupIds = data.map((group) => group.group_id as string);

            if (groupIds.length > 0) {
                const { data: groupsData, error: groupsError } = await supabase
                    .from('groups')
                    .select('*')
                    .in('id', groupIds);

                if (groupsError) {
                    console.error('Error fetching groups:', groupsError);
                    throw new Error(groupsError.message);
                }

                setMemberGroups(groupsData);
            }

            return data;
        },
        {
            enabled: !!userId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    useEffect(() => {
        const groupIdsToFetch = Array.from(new Set([...ownedGroups.map(g => g.id), ...memberGroups.map(g => g.id)]));

        if (groupIdsToFetch.length > 0) {
            const fetchImages = async () => {
                const promises = groupIdsToFetch.map(async (id) => {
                    const { data: imageData, error } = await supabase
                        .from('group-pictures')
                        .select('hero_picture_url')
                        .eq('group_id', id)
                        .single();

                    if (error) {
                        console.error(`Error fetching image for group ${id}:`, error.message);
                        return null;
                    }

                    if (imageData && imageData.hero_picture_url) {
                        const { data: publicURL } = await supabase.storage
                            .from('group-pictures')
                            .getPublicUrl(imageData.hero_picture_url);

                        return { groupId: id, publicUrl: publicURL.publicUrl };
                    } else {
                        console.warn(`No hero_picture_url found for group ${id}`);
                    }
                    return null;
                });

                const results = await Promise.all(promises);

                const urlMapping = results.reduce((acc, curr) => {
                    if (curr) {
                        acc[curr.groupId] = curr.publicUrl;
                    }
                    return acc;
                }, {} as { [groupId: string]: string });

                setImageUrls(urlMapping);
            };

            fetchImages();
        }
    }, [ownedGroups, memberGroups]);

    const memoizedOwnedGroups = useMemo(() => ownedGroups, [ownedGroups]);
    const memoizedMemberGroups = useMemo(() => memberGroups, [memberGroups]);
    const memoizedImageUrls = useMemo(() => imageUrls, [imageUrls]);

    return (
        <div className="flex flex-col gap-8 w-fit">
            <div className="flex flex-col gap-4">
                <h2 className='text-2xl font-bold'>Owned Groups</h2>
                <div className="flex gap-8 max-[1200px]:max-w-[100vw] max-[1200px]:w-full max-[1200px]:overflow-x-scroll min-[1200px]:w-fit min-[1200px]:overflow-x-hidden max-h-[416px] min-[800px]:grid max-[900px]:grid-cols-1 min-[1200px]:grid-cols-2">
                    {memoizedOwnedGroups?.map((group) => (
                        <Link href={`/group-page/${group.id}`} key={group.id}>
                            <div key={group.id} className="border rounded-md border-white/10 w-full">
                                <div className="flex w-full gap-4 p-4 h-[192px]">
                                    <div className="flex flex-col items-center justify-center gap-4 border rounded-md border-white/10 aspect-square">
                                        {memoizedImageUrls[group.id] ? (
                                            <Image
                                                className="rounded-md"
                                                src={memoizedImageUrls[group.id]}
                                                alt={`Group ${group.group_name}`}
                                                width={200}
                                                height={200}
                                            />
                                        ) : (
                                            <span>No image available</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h1 className="text-2xl font-bold line-clamp-2">{group.group_name}</h1>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-lg font-medium text-white/70">{group.group_country}</p>
                                            <p className="text-white/50">{group.group_city}</p>
                                        </div>
                                        <Button className="rounded-md mt-2 w-fit"
                                            onClick={() => router.push(`/group-page/${group.id}`)}>View group</Button>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <h2 className='text-2xl font-bold'>Member Groups</h2>
                <div className="flex gap-8 max-[1200px]:max-w-[100vw] max-[1200px]:overflow-x-scroll min-[1200px]:w-fit min-[1200px]:overflow-x-hidden max-h-[416px] min-[800px]:grid max-[900px]:grid-cols-1 min-[1200px]:grid-cols-2">
                    {memoizedMemberGroups?.map((group) => (
                        <Link href={`/group-page/${group.id}`} key={group.id}>
                            <div key={group.id} className="border rounded-md border-white/10 w-full">
                                <div className="flex w-full gap-4 p-4 h-[192px]">
                                    <div className="flex flex-col items-center justify-center gap-4 border rounded-md border-white/10 aspect-square">
                                        {memoizedImageUrls[group.id] ? (
                                            <Image
                                                className="rounded-md"
                                                src={memoizedImageUrls[group.id]}
                                                alt={`Group ${group.group_name}`}
                                                width={200}
                                                height={200}
                                            />
                                        ) : (
                                            <span>No image available</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h1 className="text-2xl font-bold line-clamp-2">{group.group_name}</h1>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-lg font-medium text-white/70">{group.group_country}</p>
                                            <p className="text-white/50">{group.group_city}</p>
                                        </div>
                                        <Button className="rounded-md mt-2 w-fit"
                                            onClick={() => router.push(`/group-page/${group.id}`)}>View group</Button>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};