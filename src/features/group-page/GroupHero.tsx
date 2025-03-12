"use client"

import { DeleteGroupPictureDialog } from "@/components/dashboard/modals/groups/DeleteGroupImageDialog"
import { UpdateGroupHeroImageDialog } from "@/components/dashboard/modals/groups/UpdateGroupHeroImageDialog"
import { GroupReportDialog } from "@/components/dashboard/modals/contact/GroupReportDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider"
import { useUserContext } from "@/providers/UserContextProvider"
import { Database } from "@/types/supabase"
import { GroupData, GroupMembersData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Edit, LogIn, LogOut, MapPin, Save, Users, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { ShareDialog } from "../qr-code-generator/ShareDialog"
import { usePathname } from "next/navigation"
import { useViewContext } from "@/providers/pageViewProvider"

interface GroupHeroProps {
    groupId: string
}


export const GroupHero = ({
    groupId
}: GroupHeroProps) => {
    const supabase = createClientComponentClient<Database>()
    const queryClient = useQueryClient()
    const { userId } = useUserContext()
    const { ownerId } = useGroupOwnerContext()
    const pathname = usePathname()
    const [groupData, setGroupData] = useState<GroupData[]>()
    const [groupNameToEdit, setGroupNameToEdit] = useState(false)
    const [newGroupName, setNewGroupName] = useState("")
    const [groupCityToEdit, setGroupCityToEdit] = useState(false)
    const [newGroupCity, setNewGroupCity] = useState("")
    const [newGroupCountry, setNewGroupCountry] = useState("")
    const [groupMembersData, setGroupMembersData] = useState<GroupMembersData[]>()
    const [imageUrls, setImageUrls] = useState<{ publicUrl: string }[]>([]);
    const { setView } = useViewContext()

    useQuery(['groups'], async () => {
        const { data, error } = await supabase
            .from("groups")
            .select("*")
            .eq("id", groupId)

        if (error) {
            throw error
        }

        if (data) {
            setGroupData(data)
        }
    },
        {
            cacheTime: 10 * 60 * 1000,
        })

    const editGroupNameMutation = useMutation(async (newGroupName: string) => {
        const { data, error } = await supabase
            .from("groups")
            .update({ group_name: newGroupName })
            .eq("group_owner", userId)
            .eq("id", groupId)
        if (error) {
            throw error
        }

        if (data) {
            setGroupNameToEdit(false)
        }
    }, {
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Group name changed successfully",
            });

            queryClient.invalidateQueries('groups')
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to change group name",
            });
        },
    })

    const editGroupLocationMutation = useMutation(async () => {
        const { data, error } = await supabase
            .from("groups")
            .update({ group_city: newGroupCity, group_country: newGroupCountry })
            .eq("group_owner", userId)
            .eq("id", groupId)
        if (error) {
            throw error
        }

        if (data) {
            setGroupCityToEdit(false)
        }
    }, {
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Group location changed successfully",
            });

            queryClient.invalidateQueries('groups')
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to change group location",
            });
        }
    })

    useQuery(['group-members', groupId], async () => {
        const { data, error } = await supabase
            .from("group-members")
            .select("*", { count: "exact" })
            .eq("group_id", groupId)

        if (error) {
            throw error
        }

        if (data) {
            setGroupMembersData(data)
        }
    },
        {
            cacheTime: 10 * 60 * 1000,
        })

    const { data: images, isLoading } = useQuery(
        ['group-pictures', groupId],
        async () => {
            const { data, error } = await supabase
                .from('group-pictures')
                .select('*')
                .eq('group_id', groupId)
            if (error) {
                throw error;
            }
            return data || [];
        },
        {
            enabled: !!groupId,
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

    const joinGroupMutation = useMutation(
        async () => {
            const { data, error } = await supabase
                .from('group-members')
                .upsert({
                    group_id: groupId,
                    member_id: userId,
                    joined_at: new Date().toISOString()
                });
            if (error) {
                throw error;
            }
            return data;
        },
        {
            onSuccess: () => {
                toast({
                    title: "Success",
                    description: "Joined group successfully",
                });

                queryClient.invalidateQueries('group-members');
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to join group",
                });
            }
        }
    );

    const leaveGroupMutation = useMutation(
        async () => {
            const { data, error } = await supabase
                .from('group-members')
                .delete()
                .eq('group_id', groupId)
                .eq('member_id', userId);
            if (error) {
                throw error;
            }
            return data;
        },
        {
            onSuccess: () => {
                toast({
                    title: "Success",
                    description: "Left group successfully",
                });

                queryClient.invalidateQueries('group-members');
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to leave group",
                });
            }
        });

    const memoizedGroupData = useMemo(() => groupData, [groupData]);
    const memoizedGroupMembersData = useMemo(() => groupMembersData, [groupMembersData]);
    const memoizedImageUrls = useMemo(() => imageUrls, [imageUrls]);

    return (
        <>
            <div className="flex flex-col gap-4 max-w-[1200px] w-full">
                {memoizedGroupData?.map((group) => (
                    <div key={group.id} className="w-full flex flex-wrap gap-8">
                        <div className="flex gap-4 max-w-[600px] w-full">
                            <div className="flex flex-col gap-4">
                                {memoizedImageUrls.map((image) => (
                                    <Image className="min-[768px]:aspect-video rounded-md object-contain border border-white/10"
                                        key={image.publicUrl}
                                        src={image.publicUrl}
                                        alt=""
                                        width={2000}
                                        height={2000}
                                    />
                                ))}

                                {pathname.includes("dashboard") && ownerId === userId && (
                                    (images?.length ?? 0) > 0 && (
                                        <div className="flex gap-4">
                                            <DeleteGroupPictureDialog images={images} />

                                            <UpdateGroupHeroImageDialog groupId={groupId} />
                                        </div>
                                    )) || (
                                        pathname.includes("dashboard") && ownerId === userId && (
                                            <UpdateGroupHeroImageDialog groupId={groupId} />
                                        )
                                    )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex gap-4">
                                <div className="flex gap-4 mb-4">
                                    <h1 className="text-2xl font-bold tracking-wider">{group.group_name}</h1>
                                    {pathname.includes("/dashboard") && userId === ownerId && !groupNameToEdit &&
                                        <Button className="text-white/70"
                                            variant="ghost"
                                            onClick={() => setGroupNameToEdit(true)}>
                                            <Edit size={20} />
                                        </Button>}
                                </div>
                                <div>
                                    {pathname.includes("/dashboard") && userId === ownerId && groupNameToEdit && (
                                        <div className="flex gap-4">
                                            <Input placeholder="New group name"
                                                value={newGroupName}
                                                onChange={(e) => setNewGroupName(e.target.value)}
                                            />
                                            <Button className="text-red-500"
                                                variant="ghost"
                                                onClick={() => setGroupNameToEdit(false)}><X size={20} /></Button>
                                            <Button className="text-blue-500"
                                                variant="ghost"
                                                onClick={() => {
                                                    editGroupNameMutation.mutateAsync(newGroupName)

                                                    setGroupNameToEdit(false)
                                                }}><Save size={20} /></Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={24}
                                            strokeWidth={1} />
                                        {groupCityToEdit === false && (
                                            <p className="text-lg text-white/70">{group.group_city}, {group.group_country}</p>
                                        ) || (
                                                <></>
                                            )}
                                    </div>
                                    {pathname.includes("/dashboard") && userId === ownerId && !groupCityToEdit &&
                                        <Button className="text-white/70"
                                            variant="ghost"
                                            onClick={() => setGroupCityToEdit(true)}>
                                            <Edit size={20} />
                                        </Button>}
                                </div>
                                {pathname.includes("/dashboard") && userId === ownerId && groupCityToEdit && (
                                    <div className="flex gap-4">
                                        <Input className="max-w-[128px]"
                                            placeholder="New group city"
                                            value={newGroupCity}
                                            onChange={(e) => setNewGroupCity(e.target.value)}
                                        />
                                        <Input className="max-w-[128px]"
                                            placeholder="New group country"
                                            value={newGroupCountry}
                                            onChange={(e) => setNewGroupCountry(e.target.value)}
                                        />
                                        <Button className="text-red-500"
                                            variant="ghost"
                                            onClick={() => setGroupCityToEdit(false)}><X size={20} /></Button>
                                        <Button className="text-blue-500"
                                            variant="ghost"
                                            onClick={() => {
                                                editGroupLocationMutation.mutateAsync()

                                                setGroupCityToEdit(false)
                                            }}><Save size={20} /></Button>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 items-center">
                                <Users size={24}
                                    strokeWidth={1} />
                                <p className="text-white/60 font-medium tracking-wide">{memoizedGroupMembersData?.length || 0} {memoizedGroupMembersData?.length === 1 ? "member" : "members"}</p>
                            </div>

                            <GroupReportDialog groupId={groupId} />
                        </div>
                    </div>
                ))}

                <div className="py-4 sticky top-24 flex justify-between max-w-[1200px] w-full justify-self-center">
                    <div className="flex gap-4">
                        <Button variant="ghost"
                            className="text-white/70"
                            onClick={() => setView("about")}>
                            About
                        </Button>
                        <Button variant="ghost"
                            className="text-white/70"
                            onClick={() => setView("photos")}>
                            Photos
                        </Button>
                        <Button variant="ghost"
                            className="text-white/70"
                            onClick={() => setView("posts")}>
                            Posts
                        </Button>
                    </div>

                    {userId && (
                        <div className="flex gap-4">
                            <ShareDialog />
                            {memoizedGroupMembersData?.some((member) => member.member_id === userId) ? (
                                <Button variant="ghost"
                                    className="text-red-500"
                                    onClick={() => leaveGroupMutation.mutateAsync()}><LogOut size={20} /></Button>
                            ) : (
                                <Button className="text-green-500"
                                    variant="ghost"
                                    onClick={() => joinGroupMutation.mutateAsync()}><LogIn size={20} /></Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Toaster />
        </>
    )
}