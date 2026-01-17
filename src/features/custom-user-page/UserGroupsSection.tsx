import { SidebarProvider } from "@/components/ui/sidebar";
import { Database } from "@/types/supabase";
import { GroupData } from "@/types/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { GroupSidebar } from "@/components/GroupSidebar";

interface UserGroupsSectionProps {
    userId: string;
}

export const UserGroupsSection = ({ userId }: UserGroupsSectionProps) => {
    const supabase = createClientComponentClient<Database>();
    const [ownedGroups, setOwnedGroups] = useState<any[]>([]);
    const [memberGroups, setMemberGroups] = useState<any[]>([]);
    const [imageUrls, setImageUrls] = useState<{ [groupId: string]: string }>({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
    const [selectedGroupImageUrl, setSelectedGroupImageUrl] = useState<string | null>(null);

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
        <>
            <div className="flex flex-col gap-8 w-full">
                {memoizedOwnedGroups.length > 0 && (
                    <div className="flex flex-col gap-4 w-full">
                        <h2 className='text-2xl tracking-wider font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent'>
                            Owned Groups
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            {memoizedOwnedGroups?.map((group) => (
                                <div 
                                    onClick={() => {
                                        setIsSidebarOpen(true);
                                        setSelectedGroup(group);
                                        setSelectedGroupImageUrl(memoizedImageUrls[group.id]);
                                    }}
                                    key={group.id}
                                    className="group bg-white/5 backdrop-blur-sm hover:bg-white/10 border border-white/10 hover:border-white/20 cursor-pointer rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                                >
                                    <div className="flex w-full gap-4 p-4">
                                        <div className="flex-shrink-0 w-24 h-24 overflow-hidden rounded-xl ring-2 ring-white/10 group-hover:ring-white/30 transition-all">
                                            {memoizedImageUrls[group.id] ? (
                                                <Image
                                                    className="w-full h-full object-cover"
                                                    src={memoizedImageUrls[group.id]}
                                                    alt={`Group ${group.group_name}`}
                                                    width={200}
                                                    height={200}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                    <p className="text-white/50 text-xs text-center px-2">No image</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2 flex-1 min-w-0 justify-center">
                                            <h1 className="text-lg font-semibold line-clamp-2 tracking-wider text-white/90 group-hover:text-white transition-colors">
                                                {group.group_name}
                                            </h1>
                                            <p className="text-sm text-white/70 truncate">
                                                {group.group_country}, {group.group_city}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {memoizedMemberGroups.length > 0 && (
                    <div className="flex flex-col gap-4 w-full">
                        <h2 className='text-2xl tracking-wider font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent'>
                            Member Groups
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            {memoizedMemberGroups?.map((group) => (
                                <div 
                                    onClick={() => {
                                        setIsSidebarOpen(true);
                                        setSelectedGroup(group);
                                        setSelectedGroupImageUrl(memoizedImageUrls[group.id]);
                                    }}
                                    key={group.id}
                                    className="group bg-white/5 backdrop-blur-sm hover:bg-white/10 border border-white/10 hover:border-white/20 cursor-pointer rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                                >
                                    <div className="flex w-full gap-4 p-4">
                                        <div className="flex-shrink-0 w-24 h-24 overflow-hidden rounded-xl ring-2 ring-white/10 group-hover:ring-white/30 transition-all">
                                            {memoizedImageUrls[group.id] ? (
                                                <Image
                                                    className="w-full h-full object-cover"
                                                    src={memoizedImageUrls[group.id]}
                                                    alt={`Group ${group.group_name}`}
                                                    width={200}
                                                    height={200}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                    <p className="text-white/50 text-xs text-center px-2">No image</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2 flex-1 min-w-0 justify-center">
                                            <h1 className="text-lg font-semibold line-clamp-2 tracking-wider text-white/90 group-hover:text-white transition-colors">
                                                {group.group_name}
                                            </h1>
                                            <p className="text-sm text-white/70 truncate">
                                                {group.group_country}, {group.group_city}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <SidebarProvider>
                {isSidebarOpen && <GroupSidebar imageUrl={selectedGroupImageUrl}
                    selectedGroup={selectedGroup}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)} />}
            </SidebarProvider>
        </>
    );
};