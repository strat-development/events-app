import { Database } from "@/types/supabase"
import { GroupData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "react-query"
import Image from "next/image"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider"
import { Pagination } from "@mui/material"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"
import { useUserContext } from "@/providers/UserContextProvider"
import { DeleteGroupDialog } from "./modals/groups/DeleteGroupDialog"



export const GroupCard = () => {
    const supabase = createClientComponentClient<Database>()
    const { ownerId } = useGroupOwnerContext();
    const { userId } = useUserContext();
    const [attendingGroups, setAttendingGroups] = useState(true)
    const [imageUrls, setImageUrls] = useState<{ [groupId: string]: string }>({});
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const router = useRouter();

    const fetchedGroups = useQuery(
        ['groups', userId],
        async () => {
            const { data, error } = await supabase
                .from("group-members")
                .select(`
                    groups(
                        *
                    )
                    `
                )
                .eq('member_id', userId);

            if (error) {
                console.error("Error fetching groups:", error.message);
                throw new Error(error.message);
            }

            return data;
        },
        {
            enabled: !!userId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    const fetchedGroupsByHosts = useQuery(
        ['groupsByHosts', userId],
        async () => {
            const { data, error } = await supabase
                .from("groups")
                .select('*')
                .eq('group_owner', ownerId);

            if (error) {
                console.error("Error fetching groups:", error.message);
                throw new Error(error.message);
            }

            return data;
        },
        {
            enabled: !!userId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    const groupIds = attendingGroups
        ? fetchedGroups.data?.map(group => group.groups?.id) || []
        : fetchedGroupsByHosts.data?.map(group => group.id) || [];

    const { data: images } = useQuery(
        ['group-pictures', groupIds],
        async () => {
            if (groupIds.length === 0) return [];

            const { data, error } = await supabase
                .from('group-pictures')
                .select('*')
                .in('group_id', groupIds);

            if (error) {
                throw error;
            }

            return data || [];
        },
        {
            enabled: groupIds.length > 0,
            cacheTime: 10 * 60 * 1000,
        }
    );

    useEffect(() => {
        if (images) {
            Promise.all(images.map(async (image) => {
                const { data: publicURL } = await supabase.storage
                    .from('group-pictures')
                    .getPublicUrl(image.hero_picture_url || "");

                return { groupId: image.group_id, publicUrl: publicURL.publicUrl };
            }))
                .then((publicUrls) => {
                    const urlMapping: { [groupId: string]: string } = {};
                    publicUrls.forEach(({ groupId, publicUrl }) => {
                        urlMapping[groupId] = publicUrl;
                    });
                    setImageUrls(urlMapping);
                })
                .catch(console.error);
        }
    }, [images]);

    const memoizedGroupsByAttendees = useMemo(() => fetchedGroups.data, [fetchedGroups.data]);
    const memoizedGroupsByHosts = useMemo(() => fetchedGroupsByHosts.data, [fetchedGroupsByHosts.data]);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const memoizedImageUrls = useMemo(() => imageUrls, [imageUrls]);
    const currentAttendingItems = memoizedGroupsByAttendees?.slice(startIndex, endIndex) ?? [];
    const currentHostItems = memoizedGroupsByHosts?.slice(startIndex, endIndex) ?? [];

    const pageCount = Math.ceil((attendingGroups ? (memoizedGroupsByAttendees?.length ?? 0) : (memoizedGroupsByHosts?.length ?? 0)) / itemsPerPage);

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-4">
                <Button className={attendingGroups === true ? "border-b-[1px] border-white/70 text-white/70 rounded-none hover:bg-transparent" : "text-white/50 hover:bg-transparent"} 
                variant="ghost"
                    onClick={() => {
                        setAttendingGroups(true);
                        fetchedGroups.refetch();
                    }}>
                    Member groups
                </Button>
                <Button className={attendingGroups === false ? "border-b-[1px] border-white/70 text-white/70 rounded-none hover:bg-transparent" : "text-white/50 hover:bg-transparent"} 
                variant="ghost"
                    onClick={() => {
                        setAttendingGroups(false);
                        fetchedGroupsByHosts.refetch();
                    }}>
                    Owned groups
                </Button>
            </div>



            {currentAttendingItems && currentAttendingItems.length === 0 && (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-white/70 text-center">You have no upcoming events to attend.</p>
                </div>
            )}
            {!currentAttendingItems && currentHostItems.length === 0 && (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-white/70 text-center">You have no upcoming events to host.</p>
                </div>
            )}

            <div className="flex flex-wrap max-[800px]:justify-center gap-8">
                {attendingGroups && (
                    currentAttendingItems?.map((group) => (
                        <div key={group.groups?.id} className="flex flex-col gap-2 w-[280px] h-[384px] border rounded-md border-white/10 p-4">
                            <div className="flex items-center justify-center border rounded-md border-white/10 w-full aspect-square">
                                {group.groups?.id && memoizedImageUrls[group.groups?.id] ? (
                                    <Image
                                        src={memoizedImageUrls[group.groups?.id]}
                                        alt={group.groups?.group_name || ""}
                                        width={200}
                                        height={200}
                                        className="object-cover rounded-md w-full max-h-[240px]"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/10 rounded-md">
                                        <p className="text-center font-medium">No image available 😔</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                <h1 className="text-lg font-bold tracking-wider line-clamp-2">{group.groups?.group_name}</h1>
                                <div className="flex flex-col gap-1">

                                    <p className="text-sm text-white/60">{group.groups?.group_city}, {group.groups?.group_country}</p>

                                </div>
                                <Button className="rounded-md mt-2 w-fit text-sm"
                                    onClick={() => router.push(`/group-page/${group.groups?.id}`)}>View group</Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="flex flex-wrap max-[800px]:justify-center gap-8">
                {!attendingGroups && (
                    currentHostItems?.map((group) => (
                        <div key={group.id} className="flex flex-col gap-2 w-[280px] h-[384px] border rounded-md border-white/10 p-4">
                            <div className="flex items-center justify-center border rounded-md border-white/10 w-full aspect-square">
                                {group.id && imageUrls[group.id] ? (
                                    <Image
                                        src={imageUrls[group.id]}
                                        alt={group.group_name || ""}
                                        width={200}
                                        height={200}
                                        className="object-cover rounded-md w-full max-h-[240px]"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/10 rounded-md">
                                        <p className="text-center font-medium">No image available 😔</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                <h1 className="text-lg font-bold tracking-wider line-clamp-2">{group.group_name}</h1>
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-white/60">{group.group_city}, {group.group_country}</p>
                                </div>
                                <div className="flex gap-4 items-baseline">
                                    <Button className="rounded-md mt-2 w-fit text-sm"
                                        onClick={() => router.push(`/dashboard/group-page/${group.id}`)}>View group</Button>
                                    <DeleteGroupDialog groupId={group.id} />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Pagination
                className="self-center"
                count={pageCount}
                page={currentPage}
                onChange={handlePageChange}
                variant="outlined"
                sx={{
                    '& .MuiPaginationItem-root': {
                        color: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0)',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                    '& .Mui-selected': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1) !important',
                        color: 'white',
                    },
                }}
            />
        </div>
    );
};

