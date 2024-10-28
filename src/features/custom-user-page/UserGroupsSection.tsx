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
    const [ownedGroups, setOwnedGroups] = useState<string[]>([]);
    const [memberGroups, setMemberGroups] = useState<string[]>([]);
    const [imageUrls, setImageUrls] = useState<{ [groupId: string]: string }>({});

    const fetchOwnedGroups = useQuery(
        'ownedGroups',
        async () => {
            const { data, error } = await supabase
                .from('groups')
                .select('id')
                .eq('group_owner', userId);

            if (error) {
                console.error('Error fetching owned groups:', error);
                throw new Error(error.message);
            }

            if (data) {
                setOwnedGroups(data.map((group) => group.id as string));
            }

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

            if (data) {
                setMemberGroups(data.map((group) => group.group_id as string));
            }

            return data;
        },
        {
            enabled: !!userId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    useEffect(() => {
        const groupIdsToFetch = Array.from(new Set([...ownedGroups, ...memberGroups])); // Ensure unique IDs

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
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
                <h2 className='text-2xl font-bold'>Owned Groups</h2>
                <div className='grid grid-cols-4 gap-4'>
                    {memoizedOwnedGroups.map((groupId) => (
                        <Link href={`/group-page/${groupId}`} key={groupId}>
                            <div className='flex flex-col gap-2 items-center border p-4 rounded-lg'>
                                {memoizedImageUrls[groupId] ? (
                                    <Image className="rounded-md"
                                        src={memoizedImageUrls[groupId]}
                                        alt={`Group ${groupId}`}
                                        width={200}
                                        height={200}
                                    />
                                ) : (
                                    <span>No image available</span>
                                )}
                                <span>{groupId}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <h2 className='text-2xl font-bold'>Member Groups</h2>
                <div className='grid grid-cols-4 gap-4'>
                    {memoizedMemberGroups.map((groupId) => (
                        <Link href={`/group-page/${groupId}`} key={groupId}>
                            <div className='flex flex-col gap-2 items-center border p-4 rounded-lg'>
                                {memoizedImageUrls[groupId] ? (
                                    <Image className="rounded-md"
                                        src={memoizedImageUrls[groupId]}
                                        alt={`Group ${groupId}`}
                                        width={200}
                                        height={200}
                                    />
                                ) : (
                                    <span>No image available</span>
                                )}
                                <span>{groupId}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};
