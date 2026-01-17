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
import { EditGroupDialog } from "./modals/groups/EditGroupModal"

export const GroupSection = () => {
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
        <div className="flex flex-col gap-6">
            {/* Header with tabs */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                <h1 className="text-3xl font-bold tracking-wider bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-4">
                    Your Groups
                </h1>
                <div className="flex gap-2">
                    <Button 
                        className={attendingGroups === true 
                            ? "bg-white/20 text-white" 
                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90"
                        }
                        variant="ghost"
                        onClick={() => {
                            setAttendingGroups(true);
                            fetchedGroups.refetch();
                        }}
                    >
                        Member Groups
                    </Button>
                    <Button 
                        className={attendingGroups === false 
                            ? "bg-white/20 text-white" 
                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90"
                        }
                        variant="ghost"
                        onClick={() => {
                            setAttendingGroups(false);
                            fetchedGroupsByHosts.refetch();
                        }}
                    >
                        Owned Groups
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap gap-6">
                {attendingGroups && (
                    <>
                        {currentAttendingItems && currentAttendingItems.length === 0 && (
                            <div className="col-span-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 shadow-xl">
                                <div className="flex flex-col items-center gap-6">
                                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 rounded-full">
                                        <Globe size={64} strokeWidth={1.5} className="text-white" />
                                    </div>
                                    <div className="text-center">
                                        <h2 className="text-2xl font-bold text-white/90 mb-2">No Groups Yet</h2>
                                        <p className="text-white/60">You're not a member of any group</p>
                                    </div>
                                    <Button
                                        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                                        onClick={() => router.push('/home')}
                                    >
                                        Discover Groups
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentAttendingItems?.map((group) => (
                            <div key={group.groups?.id} className="group bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl w-[280px] h-[360px] flex flex-col">
                                <div className="relative h-40 overflow-hidden">
                                    {group.groups?.id && memoizedImageUrls[group.groups?.id] ? (
                                        <Image
                                            src={memoizedImageUrls[group.groups?.id]}
                                            alt={group.groups?.group_name || ""}
                                            width={400}
                                            height={400}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                                            <p className="text-center text-sm text-white/50 font-medium">No image</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 flex flex-col gap-2">
                                    <h2 className="text-base font-bold tracking-wide text-white/90 line-clamp-2 group-hover:text-white transition-colors">
                                        {group.groups?.group_name}
                                    </h2>
                                    <p className="text-sm text-white/60 truncate">
                                        {group.groups?.group_city}, {group.groups?.group_country}
                                    </p>
                                    <Button 
                                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
                                        variant="outline"
                                        onClick={() => router.push(`/group-page/${group.groups?.id}`)}
                                    >
                                        View Group
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            <div className="flex flex-wrap gap-6">
                {!attendingGroups && (
                    <>
                        <CreateGroupDialog />

                        {currentHostItems?.map((group) => (
                            <div key={group.id} className="group bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl w-[280px] h-[360px] flex flex-col">
                                <div className="relative h-40 overflow-hidden">
                                    {group.id && imageUrls[group.id] ? (
                                        <Image
                                            src={imageUrls[group.id]}
                                            alt={group.group_name || ""}
                                            width={400}
                                            height={400}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                                            <p className="text-center text-sm text-white/50 font-medium">No image</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 flex flex-col gap-3">
                                    <h2 className="text-lg font-bold tracking-wide text-white/90 line-clamp-2 group-hover:text-white transition-colors">
                                        {group.group_name}
                                    </h2>
                                    <p className="text-sm text-white/60 truncate">
                                        {group.group_city}, {group.group_country}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button 
                                            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
                                            variant="outline"
                                            onClick={() => router.push(`/dashboard/group-page/${group.id}`)}
                                        >
                                            View
                                        </Button>
                                        <EditGroupDialog groupId={group.id} />
                                        <DeleteGroupDialog groupId={group.id} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
                    
            {((attendingGroups && currentAttendingItems.length > 20) || (!attendingGroups && currentHostItems.length > 20)) && totalPages > 1 && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-xl">
                    <Pagination>
                        <PaginationContent className="flex gap-2">
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={currentPage === 1 ? undefined : () => handlePageChange(currentPage - 1)}
                                    aria-disabled={currentPage === 1}
                                    className="hover:bg-white/10 transition-colors"
                                />
                            </PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        isActive={page === currentPage}
                                        onClick={() => handlePageChange(page)}
                                        className={page === currentPage 
                                            ? "bg-white/10 text-white hover:bg-white/15" 
                                            : "hover:bg-white/10 transition-colors"
                                        }
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={currentPage === totalPages ? undefined : () => handlePageChange(currentPage + 1)}
                                    aria-disabled={currentPage === totalPages}
                                    className="hover:bg-white/10 transition-colors"
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
};

