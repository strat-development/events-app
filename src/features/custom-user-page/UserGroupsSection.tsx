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
        <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-4 w-full">
                <h2 className='text-xl tracking-wider font-semibold w-fit'>Owned Groups</h2>
                <div className="flex gap-4 max-[768px]:pr-24 max-[900px]:max-w-[100vw] min-[900px]:w-full max-[1200px]:overflow-x-scroll min-[1200px]:overflow-x-hidden max-h-[416px] min-[800px]:grid max-[900px]:grid-cols-1 min-[1200px]:grid-cols-2">
                    {memoizedOwnedGroups?.map((group) => (
                        <Link key={group.id} href={`/group-page/${group.id}`}>
                            <div key={group.id} className="border rounded-md border-white/10 min-[1200px]:w-fit">
                                <div className="flex w-full gap-4 p-4 h-[124px]">
                                    <div className="flex flex-col items-center aspect-square justify-center gap-4 border rounded-md border-white/10">
                                        {memoizedImageUrls[group.id] ? (
                                            <Image
                                                className="rounded-md"
                                                src={memoizedImageUrls[group.id]}
                                                alt={`Group ${group.group_name}`}
                                                width={1920}
                                                height={1080}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col gap-2 items-center justify-center rounded-md bg-white/5">
                                                <p className="text-white/50 text-lg">No picture available 😔</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h1 className="text-xl font-semibold line-clamp-2 tracking-wider">{group.group_name}</h1>
                                        <p>{group.group_country}, {group.group_city}</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-4 w-full">
                <h2 className='text-xl tracking-wider font-semibold w-fit'>Member Groups</h2>
                <div className="flex gap-4 max-[768px]:pr-24 max-[900px]:max-w-[100vw] min-[900px]:w-full max-[1200px]:overflow-x-scroll min-[1200px]:overflow-x-hidden max-h-[416px] min-[800px]:grid max-[900px]:grid-cols-1 min-[1200px]:grid-cols-2">
                    {memoizedMemberGroups?.map((group) => (
                        <Link key={group.id} href={`/group-page/${group.id}`}>
                            <div key={group.id} className="border rounded-md border-white/10 min-[1200px]:w-fit">
                                <div className="flex w-full gap-4 p-4 h-[124px]">
                                    <div className="flex flex-col aspect-square items-center justify-center gap-4 border rounded-md border-white/10">
                                        {memoizedImageUrls[group.id] ? (
                                            <Image
                                                className="rounded-md"
                                                src={memoizedImageUrls[group.id]}
                                                alt={`Group ${group.group_name}`}
                                                width={1920}
                                                height={1080}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col gap-2 items-center justify-center rounded-md bg-white/5">
                                                <p className="text-white/50 text-lg">No picture available 😔</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h1 className="text-xl font-semibold line-clamp-2 tracking-wider">{group.group_name}</h1>
                                        <p>{group.group_country}, {group.group_city}</p>
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