"use client"

import { DeleteGroupPictureDialog } from "@/components/dashboard/modals/groups/DeleteGroupImageDialog"
import { UpdateGroupHeroImageDialog } from "@/components/dashboard/modals/groups/UpdateGroupHeroImageDialog"
import { GroupReportDialog } from "@/components/dashboard/modals/contact/GroupReportDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider"
import { useUserContext } from "@/providers/UserContextProvider"
import { Database } from "@/types/supabase"
import { GroupData, GroupMembersData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Edit, LogIn, LogOut, MapPin, Save, Users, X } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { ShareDialog } from "../qr-code-generator/ShareDialog"
import { usePathname, useRouter } from "next/navigation"
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
    const isGroupAlbum = pathname.includes("group-photos-album")
    const router = useRouter()

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
          <div className="flex flex-col gap-6 w-full">
                {memoizedGroupData?.map((group) => (
                    <div key={group.id} className="w-full">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="flex-1 flex flex-col gap-4">
                                    {memoizedImageUrls.map((image) => (
                                        <div key={image.publicUrl} className="relative group overflow-hidden rounded-xl">
                                            <Image 
                                                className="w-full aspect-video rounded-xl object-cover ring-2 ring-white/10 transition-all duration-300 group-hover:ring-white/30"
                                                src={image.publicUrl}
                                                alt=""
                                                width={2000}
                                                height={2000}
                                            />
                                        </div>
                                    ))}

                                    {pathname.includes("dashboard") && ownerId === userId && (
                                        <div className="flex gap-3">
                                            {(images?.length ?? 0) > 0 && (
                                                <>
                                                    <DeleteGroupPictureDialog images={images} />
                                                    <UpdateGroupHeroImageDialog groupId={groupId} />
                                                </>
                                            ) || (
                                                <UpdateGroupHeroImageDialog groupId={groupId} />
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col gap-4">
                                    {!groupNameToEdit ? (
                                        <div className="flex items-start gap-3">
                                            <h1 className="text-3xl font-bold tracking-wider bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                                                {group.group_name}
                                            </h1>
                                            {pathname.includes("/dashboard") && userId === ownerId && (
                                                <Button 
                                                    className="text-white/70 hover:text-white transition-colors"
                                                    variant="ghost"
                                                    onClick={() => setGroupNameToEdit(true)}
                                                >
                                                    <Edit size={18} />
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Input 
                                                placeholder="New group name"
                                                value={newGroupName}
                                                onChange={(e) => setNewGroupName(e.target.value)}
                                                className="flex-1"
                                            />
                                            <Button 
                                                className="text-red-500 hover:text-red-400"
                                                variant="ghost"
                                                onClick={() => setGroupNameToEdit(false)}
                                            >
                                                <X size={18} />
                                            </Button>
                                            <Button 
                                                className="text-blue-500 hover:text-blue-400"
                                                variant="ghost"
                                                onClick={() => {
                                                    editGroupNameMutation.mutateAsync(newGroupName)
                                                    setGroupNameToEdit(false)
                                                }}
                                            >
                                                <Save size={18} />
                                            </Button>
                                        </div>
                                    )}

                                    {!groupCityToEdit ? (
                                        <div className="flex items-center gap-3">
                                            <MapPin size={20} className="text-white/70 flex-shrink-0" strokeWidth={1.5} />
                                            <p className="text-base text-white/70">{group.group_city}, {group.group_country}</p>
                                            {pathname.includes("/dashboard") && userId === ownerId && (
                                                <Button 
                                                    className="text-white/70 hover:text-white transition-colors ml-auto"
                                                    variant="ghost"
                                                    onClick={() => setGroupCityToEdit(true)}
                                                >
                                                    <Edit size={16} />
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Input 
                                                className="flex-1"
                                                placeholder="City"
                                                value={newGroupCity}
                                                onChange={(e) => setNewGroupCity(e.target.value)}
                                            />
                                            <Input 
                                                className="flex-1"
                                                placeholder="Country"
                                                value={newGroupCountry}
                                                onChange={(e) => setNewGroupCountry(e.target.value)}
                                            />
                                            <Button 
                                                className="text-red-500"
                                                variant="ghost"
                                                onClick={() => setGroupCityToEdit(false)}
                                            >
                                                <X size={18} />
                                            </Button>
                                            <Button 
                                                className="text-blue-500"
                                                variant="ghost"
                                                onClick={() => {
                                                    editGroupLocationMutation.mutateAsync()
                                                    setGroupCityToEdit(false)
                                                }}
                                            >
                                                <Save size={18} />
                                            </Button>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <Users size={20} className="text-white/70" strokeWidth={1.5} />
                                        <p className="text-white/70 font-medium">
                                            {memoizedGroupMembersData?.length || 0} {memoizedGroupMembersData?.length === 1 ? "member" : "members"}
                                        </p>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-white/10">
                                        <GroupReportDialog groupId={groupId} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sticky top-20 z-10 mt-6 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex flex-wrap gap-2">
                                    {isGroupAlbum ? (
                                        <>
                                            <Button 
                                                variant="ghost"
                                                className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 font-medium"
                                                onClick={() => router.push(`/group-page/${groupId}`)}
                                            >
                                                About
                                            </Button>
                                            <Button 
                                                variant="ghost"
                                                className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 font-medium"
                                                onClick={() => router.push(`/group-page/${groupId}`)}
                                            >
                                                Photos
                                            </Button>
                                            <Button 
                                                variant="ghost"
                                                className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 font-medium"
                                                onClick={() => router.push(`/group-page/${groupId}`)}
                                            >
                                                Posts
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button 
                                                variant="ghost"
                                                className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 font-medium"
                                                onClick={() => setView("about")}
                                            >
                                                About
                                            </Button>
                                            <Button 
                                                variant="ghost"
                                                className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 font-medium"
                                                onClick={() => setView("photos")}
                                            >
                                                Photos
                                            </Button>
                                            <Button 
                                                variant="ghost"
                                                className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 font-medium"
                                                onClick={() => setView("posts")}
                                            >
                                                Posts
                                            </Button>
                                        </>
                                    )}
                                </div>

                                {userId && (
                                    <div className="flex gap-2">
                                        <ShareDialog />
                                        {memoizedGroupMembersData?.some((member) => member.member_id === userId) ? (
                                            <Button 
                                                variant="ghost"
                                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 font-medium"
                                                onClick={() => leaveGroupMutation.mutateAsync()}
                                            >
                                                <LogOut size={18} />
                                                <span className="ml-2 hidden sm:inline">Leave</span>
                                            </Button>
                                        ) : (
                                            <Button 
                                                variant="ghost"
                                                className="text-green-500 hover:text-green-400 hover:bg-green-500/10 transition-all duration-300 font-medium"
                                                onClick={() => joinGroupMutation.mutateAsync()}
                                            >
                                                <LogIn size={18} />
                                                <span className="ml-2 hidden sm:inline">Join</span>
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}