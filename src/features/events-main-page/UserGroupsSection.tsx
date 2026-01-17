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
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold tracking-wider mb-4 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    Your Groups
                </h3>
                <div className="flex flex-col gap-4 overflow-y-auto overflow-x-hidden max-h-[500px]">
                    {memoizedGroupsData && memoizedGroupsData.length > 0 ? (
                        memoizedGroupsData.map((group) => (
                            <div 
                                onClick={async () => {
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
                                className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 cursor-pointer rounded-xl transition-all duration-300 hover:shadow-lg"
                            >
                                <div className="flex gap-4 p-4">
                                    <div className="flex-shrink-0 w-24 h-16 overflow-hidden rounded-lg ring-2 ring-white/10 group-hover:ring-white/30 transition-all">
                                        {memoizedImageUrls.length > 0 ? (
                                            memoizedImageUrls.map((url) => (
                                                <Image
                                                    key={url.publicUrl}
                                                    src={url.publicUrl}
                                                    alt="group image"
                                                    width={200}
                                                    height={200}
                                                    className="w-full h-full object-cover"
                                                />
                                            ))
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                <p className="text-xs text-white/50 text-center px-1">No image</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1 min-w-0 justify-center">
                                        <h4 className="text-base font-semibold line-clamp-2 tracking-wide text-white/90 group-hover:text-white transition-colors">
                                            {group.group_name}
                                        </h4>
                                        <p className="text-sm text-white/60 truncate">
                                            {group.group_city}, {group.group_country}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-white/50 text-center py-4">No groups yet</p>
                    )}
                </div>
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