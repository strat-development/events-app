"use client"

import { UserReportDialog } from "@/components/dashboard/modals/contact/ReportUserDialog"
import { DeleteGroupUserDialog } from "@/components/dashboard/modals/groups/DeleteGroupUserDialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { supabaseAdmin } from "@/lib/admin"
import { useUserContext } from "@/providers/UserContextProvider"
import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { IconDotsVertical } from "@tabler/icons-react"
import { format, parseISO } from "date-fns"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useQuery } from "react-query"

export const ManagementTable = () => {
    const supabase = createClientComponentClient<Database>()
    const [membersId, setMembersId] = useState<string[]>()
    const [profileImageUrls, setProfileImageUrls] = useState<{ user_id: string; publicUrl: string }[]>([]);
    const { userId } = useUserContext();
    const [searchQuery, setSearchQuery] = useState<string>("")

    const groupData = useQuery(
        ['group-data'],
        async () => {
            const { data, error } = await supabase
                .from("groups")
                .select(`id, group_name`)
                .eq("group_owner", userId)

            if (error) {
                throw new Error(error.message)
            }

            return data
        },
        {
            enabled: true,
            cacheTime: 10 * 60 * 1000,
        }
    )

    const groupIds = groupData.data?.map(group => group.id)

    const groupMembers = useQuery(
        ['group-members-data'],
        async () => {
            const { data, error } = await supabaseAdmin
                .from("group-members")
                .select(`users (*), group_id, joined_at`)
                .in("group_id", groupIds || [])

            if (error) {
                throw new Error(error.message)
            }

            if (data) {
                setMembersId(data.map((member) => member.users?.id as string))
            }
            return data
        },
        {
            enabled: !!groupIds,
            cacheTime: 10 * 60 * 1000,
        }
    )

    const { data: profileImages } = useQuery(
        ['profile-pictures', membersId],
        async () => {
            const { data, error } = await supabase
                .from('profile-pictures')
                .select('*')
                .in('user_id', membersId || [])
            if (error) {
                throw error;
            }
            return data || [];
        },
        { enabled: !!membersId, cacheTime: 10 * 60 * 1000 }
    );

    useEffect(() => {
        if (profileImages) {
            Promise.all(profileImages.map(async (image) => {
                const { data: publicURL } = await supabase.storage
                    .from('profile-pictures')
                    .getPublicUrl(image.image_url)

                return { user_id: image.user_id, publicUrl: publicURL.publicUrl };
            }))
                .then((publicUrls) => setProfileImageUrls(publicUrls.filter(url => url.user_id !== null) as { user_id: string; publicUrl: string }[]))
                .catch(console.error);
        }
    }, [profileImages]);

    const fetchEventsByGroupId = async (groupId: string) => {
        const { data, error } = await supabase
            .from("events")
            .select("*")
            .eq("group_id", groupId)
            .lt("event_date", new Date().toISOString());
        if (error) {
            throw new Error(error.message);
        }

        return data;
    };

    const { data: pastEventsData } = useQuery(
        ['group-events', groupIds],
        async () => {
            if (!groupIds || groupIds.length === 0) return [];

            const { data, error } = await supabase
                .from("events")
                .select("*")
                .in("group_id", groupIds)
                .lt("event_date", new Date().toISOString());

            if (error) throw new Error(error.message);
            return data || [];
        },
        { enabled: !!groupIds }
    );

    const combinedData = useMemo(() => {
        if (!groupMembers.data || !groupData.data) return [];

        return groupMembers.data.map((member) => {
            const group = groupData.data.find((group) => group.id === member.group_id);
            const profileImageUrl = profileImageUrls.find((url) => url.user_id === member.users?.id)?.publicUrl;


            return {
                userName: member.users?.full_name || "Unknown User",
                groupName: group?.group_name || "Unknown Group",
                profileImageUrl: profileImageUrl,
                joinedAt: member.joined_at,
                userId: member.users?.id,
            };
        });
    }, [groupMembers.data, groupData.data, profileImageUrls, pastEventsData]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    const filteredData = useMemo(() => {
        return combinedData.filter((item) =>
            item.userName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [combinedData, searchQuery]);

    return (
        <div className="max-w-[1200px] w-full pl- min-[900px]:pl-16 flex flex-col gap-8 max-[768px]:flex-wrap">
            <Input className="max-w-[180px] placeholder:text-white/50"
                id="search-input"
                type="text"
                placeholder="Search interests"
                value={searchQuery}
                onChange={handleSearchChange}
            />

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Profile Image</TableHead>
                        <TableHead>User Name</TableHead>
                        <TableHead>Group Name</TableHead>
                        <TableHead>Joined At</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.map((item, index) => (
                        <TableRow className="text-white/70"
                            key={index}>
                            <TableCell>
                                {item.profileImageUrl && item.profileImageUrl == null && (
                                    <Image
                                        src={item.profileImageUrl}
                                        alt="Profile"
                                        className="w-10 h-10 rounded-full"
                                        width={48}
                                        height={48}
                                    />
                                ) || <div className="w-10 h-10 rounded-full" />}
                            </TableCell>
                            <TableCell className="font-medium">{item.userName}</TableCell>
                            <TableCell>{item.groupName}</TableCell>
                            <TableCell> {format(parseISO(item.joinedAt), 'yyyy-MM-dd')} </TableCell>
                            <TableCell>
                                <Popover>
                                    <PopoverTrigger>
                                        <div className="flex items-center gap-2 cursor-pointer text-white/50">
                                            <IconDotsVertical size={20} className="text-white/70" />
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-fit">
                                        <div className="flex flex-col gap-2">
                                            <UserReportDialog userId={item.userId || ""} />
                                            <DeleteGroupUserDialog userId={item.userId || ""} />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}