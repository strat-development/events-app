import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useMemo, useState } from "react"
import { useQuery } from "react-query"
import Image from "next/image"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"
import { useUserContext } from "@/providers/UserContextProvider"
import { DeleteGroupDialog } from "./modals/groups/DeleteGroupDialog"
import { CreateGroupDialog } from "./modals/groups/CreateGroupDialog"
import { Globe } from "lucide-react"
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination";

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
    const totalPages = attendingGroups ? Math.ceil((memoizedGroupsByAttendees?.length ?? 0) / itemsPerPage) : Math.ceil((memoizedGroupsByHosts?.length ?? 0) / itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    }

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





            <div className="flex flex-wrap max-[800px]:justify-center gap-8">
                {attendingGroups && (

                    <>
                        {currentAttendingItems && currentAttendingItems.length === 0 && (
                            <div className="flex flex-col justify-self-center w-full items-center gap-8 mt-24">
                                <h2 className="text-white/70 text-center text-2xl font-semibold tracking-wide">You are not a member of any group </h2>
                                <Button
                                    className="flex flex-col items-center max-w-[280px] w-full p-4 justify-center rounded-md bg-transparent hover:bg-white/5 transition-all duration-300"
                                    onClick={() => router.push('/home')}
                                    variant="ghost">
                                    <div className="flex flex-col items-center gap-8">
                                        <div className="text-6xl text-white/70">
                                            <Globe size={128}
                                                strokeWidth={1} />
                                        </div>
                                        <p className="text-xl tracking-wide text-white/50 font-medium">Discover groups and events</p>
                                    </div>
                                </Button>
                            </div>
                        )}

                        {currentAttendingItems?.map((group) => (
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
                        ))}
                    </>
                )}
            </div>

            <div className="flex flex-wrap max-[800px]:justify-center gap-8">
                {!attendingGroups && (
                    <>
                        <CreateGroupDialog />

                        {currentHostItems?.map((group) => (
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
                        ))}
                    </>
                )}
            </div>

            {(attendingGroups && currentAttendingItems.length > 0) || (!attendingGroups && currentHostItems.length > 0) && (
                <Pagination>
                    <PaginationContent className="flex gap-8">
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={currentPage === 1 ? undefined : () => handlePageChange(currentPage - 1)}
                                aria-disabled={currentPage === 1}
                            />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    isActive={page === currentPage}
                                    onClick={() => handlePageChange(page)}
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                onClick={currentPage === totalPages ? undefined : () => handlePageChange(currentPage + 1)}
                                aria-disabled={currentPage === totalPages}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
};

