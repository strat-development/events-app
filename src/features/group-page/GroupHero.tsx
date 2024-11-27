"use client"

import { UpdateGroupHeroImageDialog } from "@/components/dashboard/modals/UpdateGroupHeroImageDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import { supabaseAdmin } from "@/lib/admin"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider"
import { useUserContext } from "@/providers/UserContextProvider"
import { Database } from "@/types/supabase"
import { GroupData, GroupMembersData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { MapPin, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"

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

    const [groupData, setGroupData] = useState<GroupData[]>()
    const [groupNameToEdit, setGroupNameToEdit] = useState(false)
    const [newGroupName, setNewGroupName] = useState("")
    const [groupCityToEdit, setGroupCityToEdit] = useState(false)
    const [newGroupCity, setNewGroupCity] = useState("")
    const [newGroupCountry, setNewGroupCountry] = useState("")
    const [groupMembersData, setGroupMembersData] = useState<GroupMembersData[]>()
    const [imageUrls, setImageUrls] = useState<{ publicUrl: string }[]>([]);

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

    useQuery(['group-members'], async () => {
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

    const addGroupPicture = useMutation(
        async (paths: string[]) => {
            const results = await Promise.all(paths.map(async (path) => {
                const { data, error } = await supabase
                    .from('group-pictures')
                    .upsert({
                        group_id: groupId,
                        hero_picture_url: path
                    });
                if (error) {
                    throw error;
                }
                return data;
            }));

            return results;
        },
    );

    const updateGroupPicture = useMutation(
        async (path: string) => {
            const { data: currentData, error: fetchError } = await supabase
                .from('group-pictures')
                .select('hero_picture_url')
                .eq('group_id', groupId)
                .single();

            if (fetchError) {
                throw fetchError;
            }

            const currentUrl = currentData?.hero_picture_url;

            if (currentUrl) {
                const { error: deleteError } = await supabaseAdmin.storage
                    .from('group-pictures')
                    .remove([currentUrl]);

                if (deleteError) {
                    throw deleteError;
                }
            }

            const { data, error } = await supabase
                .from('group-pictures')
                .update({
                    hero_picture_url: path
                })
                .eq('group_id', groupId);

            if (error) {
                throw error;
            }

            return data;
        },
        {
            onSuccess: () => {
                toast({
                    title: "Success",
                    description: "Image updated successfully",
                });

                queryClient.invalidateQueries('group-pictures');
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to update image",
                });
            }
        }
    );

    const deleteGroupPicture = useMutation(
        async (path: string) => {
            const { data, error } = await supabase
                .from('group-pictures')
                .delete()
                .eq('hero_picture_url', path);
            if (error) {
                throw error;
            }

            const { error: storageError } = await supabaseAdmin.storage
                .from('group-pictures')
                .remove([path]);

            if (storageError) {
                throw storageError;
            }

            return data;
        },
        {
            onSuccess: () => {
                toast({
                    title: "Success",
                    description: "Image deleted successfully",
                });

                queryClient.invalidateQueries('group-pictures');
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to delete image",
                });
            }
        }
    );

    const uploadFiles = async (files: File[]) => {
        const uploadPromises = files.map((file) => {
            const path = `${file.name}${Math.random()}.${file.name.split('.').pop()}`;
            return { promise: supabaseAdmin.storage.from('group-pictures').upload(path, file), path };
        });

        const responses = await Promise.all(uploadPromises.map(({ promise }) => promise));

        responses.forEach((response, index) => {
            if (response.error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: `Error uploading file ${files[index].name}`
                })
            } else {
                toast({
                    title: "Success",
                    description: `File ${files[index].name} uploaded successfully`
                })
            }
        });

        return uploadPromises.map(({ path }) => path);
    }

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
                                    <Image className="aspect-video rounded-md w-full"
                                        key={image.publicUrl}
                                        src={image.publicUrl}
                                        alt=""
                                        width={2000}
                                        height={2000}
                                    />
                                ))}

                                {window.location.pathname.includes("dashboard") && ownerId === userId && (
                                    (images?.length ?? 0) > 0 && (
                                        <div className="flex gap-4">
                                            <Button variant={"destructive"}
                                                onClick={() => {
                                                    if (images) {
                                                        if (images[0].hero_picture_url) {
                                                            deleteGroupPicture.mutateAsync(images[0].hero_picture_url);
                                                        }
                                                    }
                                                }}>Delete</Button>

                                            <UpdateGroupHeroImageDialog groupId={groupId} />
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <div className="flex gap-4">
                                <div className="flex gap-4 mb-4">
                                    <h1 className="text-2xl font-bold tracking-wider">{group.group_name}</h1>
                                    {window.location.pathname.includes("/dashboard") && userId === ownerId && !groupNameToEdit && <Button onClick={() => setGroupNameToEdit(true)}>Edit</Button>}
                                </div>
                                <div>
                                    {window.location.pathname.includes("/dashboard") && userId === ownerId && groupNameToEdit && (
                                        <div className="flex gap-4">
                                            <Input placeholder="New group name"
                                                value={newGroupName}
                                                onChange={(e) => setNewGroupName(e.target.value)}
                                            />
                                            <Button onClick={() => setGroupNameToEdit(false)}>Cancel</Button>
                                            <Button onClick={() => {
                                                editGroupNameMutation.mutateAsync(newGroupName)

                                                setGroupNameToEdit(false)
                                            }}>Save</Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex gap-4">
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={24}
                                                strokeWidth={1} />
                                            <p className="text-lg text-white/70">{group.group_city}, {group.group_country}</p>
                                        </div>
                                        {window.location.pathname.includes("/dashboard") && userId === ownerId && !groupCityToEdit && <Button onClick={() => setGroupCityToEdit(true)}>Edit</Button>}
                                    </div>
                                    <div>
                                        {window.location.pathname.includes("/dashboard") && userId === ownerId && groupCityToEdit && (
                                            <div className="flex gap-4">
                                                <Input placeholder="New group city"

                                                    value={newGroupCity}
                                                    onChange={(e) => setNewGroupCity(e.target.value)}
                                                />
                                                <Input placeholder="New group country"
                                                    value={newGroupCountry}
                                                    onChange={(e) => setNewGroupCountry(e.target.value)}
                                                />
                                                <Button onClick={() => setGroupCityToEdit(false)}>Cancel</Button>
                                                <Button onClick={() => {
                                                    editGroupLocationMutation.mutateAsync()

                                                    setGroupCityToEdit(false)
                                                }}>Save</Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>


                            <div className="flex gap-2 items-center">
                                <Users size={24}
                                    strokeWidth={1} />
                                <p className="text-white/60 font-medium tracking-wide">{memoizedGroupMembersData?.length || 0} {memoizedGroupMembersData?.length === 1 ? "member" : "members"}</p>
                            </div>

                        </div>
                    </div>
                ))}

                <div className="py-4 sticky top-24 flex justify-between max-w-[1200px] w-full justify-self-center">
                    {window.location.pathname.includes("dashboard") && (
                        <div className="flex gap-8">
                            <Link className="text-lg" href={`/dashboard/group-page/${groupId}`}>
                                About
                            </Link>
                            <Link className="text-lg" href={`/dashboard/group-photos/${groupId}`}>
                                Photos
                            </Link>
                        </div>
                    ) || (
                            <div className="flex gap-4">
                                <Link className="text-lg" href={`/group-page/${groupId}`}>
                                    About
                                </Link>
                                <Link className="text-lg" href={`/group-photos/${groupId}`}>
                                    Photos
                                </Link>
                            </div>
                        )}

                    {userId && ownerId && (
                        <>
                            {memoizedGroupMembersData?.some((member) => member.member_id === userId) ? (
                                <Button variant={"destructive"}
                                    onClick={() => leaveGroupMutation.mutateAsync()}>Leave group</Button>
                            ) : (
                                <Button onClick={() => joinGroupMutation.mutateAsync()}>Join group</Button>
                            )}
                        </>
                    )}
                </div>
            </div >

            <Toaster />
        </>
    )
}