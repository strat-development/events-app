import { GroupSidebar } from "@/components/GroupSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { GroupData } from "@/types/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";

export const UserGroupsSection = () => {
    const supabase = createClientComponentClient<Database>();
    const { userId } = useUserContext();
    const [groupId, setGroupId] = useState<string[]>([]);
    const [imageUrls, setImageUrls] = useState<{ publicUrl: string }[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
    const [selectedGroupImageUrl, setSelectedGroupImageUrl] = useState<string>("");
    const [groupData, setGroupData] = useState<GroupData[]>([]);

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

            if (data) {
                setGroupData(data);
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
                .in('group_id', groupId);
            if (error) {
                throw error;
            }
            return data || [];
        },
        {
            enabled: !!groupId && groupId.length > 0,
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

    const memoizedGroupsData = useMemo(() => groupData, [groupData]);
    const memoizedImageUrls = useMemo(() => imageUrls, [imageUrls]);

    return (
        <>
            <div className="flex gap-8 max-w-[440px] w-full min-[1200px]:w-fit overflow-y-auto max-h-[416px]">
                {memoizedGroupsData?.map((group) => (
                    <div onClick={async () => {
                        setIsSidebarOpen(true);
                        setSelectedGroup(group);
                        const selectedImage = images?.find(img => img.group_id === group.id);
                        if (selectedImage) {
                            const { data: publicURL } = await supabase.storage
                                .from('group-pictures')
                                .getPublicUrl(selectedImage.hero_picture_url || "");
                            setSelectedGroupImageUrl(publicURL.publicUrl);
                        } else {
                            setSelectedGroupImageUrl("");
                        }
                    }}
                        key={group.id}
                        className="border cursor-pointer rounded-xl border-white/10 w-full">
                        <div className="flex w-full gap-4 p-4 h-[116px]">
                            <div className="flex flex-col items-center justify-center gap-4 border rounded-xl border-white/10 aspect-video w-[160px] h-fit">
                                {memoizedImageUrls.length > 0 && (
                                    memoizedImageUrls.map((url) => (
                                        <Image
                                            key={url.publicUrl}
                                            src={url.publicUrl}
                                            alt="group image"
                                            width={2000}
                                            height={2000}
                                            objectFit="cover"
                                            className="rounded-xl aspect-video w-full h-full"
                                        />
                                    ))
                                ) || (
                                        <div className="w-full h-full flex items-center justify-center bg-white/10 rounded-xl">
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
                ))
                }
            </div>

            <SidebarProvider>
                {isSidebarOpen && <GroupSidebar imageUrl={selectedGroupImageUrl || ""}
                    selectedGroup={selectedGroup}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)} />}
            </SidebarProvider>
        </>
    );
}