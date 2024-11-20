import { Database } from "@/types/supabase"
import { GroupData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "react-query"
import Image from "next/image"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider"
import { useUserContext } from "@/providers/UserContextProvider"
import { Pagination } from "@mui/material"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"



export const GroupCard = () => {
    const supabase = createClientComponentClient<Database>();
    const [groupData, setGroupData] = useState<GroupData[]>([]);
    const [imageUrls, setImageUrls] = useState<{ [groupId: string]: string }>({});
    const { ownerId } = useGroupOwnerContext();
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const router = useRouter();

    useQuery(['groups'], async () => {
        const { data, error } = await supabase
            .from("groups")
            .select("*")
            .eq("group_owner", ownerId);

        if (error) {
            throw error;
        }

        if (data) {
            setGroupData(data);
            queryClient.invalidateQueries(['groups']);
        }
    },
        {
            cacheTime: 10 * 60 * 1000,
        });

    const groupIds = groupData.map(group => group.id);

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

    const memoizedGroupData = useMemo(() => groupData, [groupData]);
    const memoizedImageUrls = useMemo(() => imageUrls, [imageUrls]);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = memoizedGroupData?.slice(startIndex, endIndex);
    const pageCount = Math.ceil((memoizedGroupData?.length ?? 0) / itemsPerPage);

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="flex flex-col gap-4 items-start">
            <div className="flex flex-wrap max-[800px]:justify-center gap-8">
                {currentItems.map((group) => (
                    <div key={group.id} className="flex flex-col gap-2 w-[280px] h-[440px] border rounded-md border-white/10 p-4">
                        <div className="flex items-center justify-center border rounded-md border-white/10 w-full aspect-square">
                            {group.id && memoizedImageUrls[group.id] ? (
                                <Image
                                    src={memoizedImageUrls[group.id]}
                                    alt={`Group ${group.group_name}`}
                                    width={200}
                                    height={200}
                                    className="object-cover w-full h-full"
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
                                <p className="text-sm text-white/70">{group.group_country}</p>
                                <p className="text-sm text-white/60">{group.group_city}</p>
                            </div>
                            <Button className="rounded-md mt-2 w-fit text-sm"
                                onClick={() => router.push(`/group-page/${group.id}`)}>View group</Button>
                        </div>
                    </div>
                ))}
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