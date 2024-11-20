"use client"

import { Button } from "@/components/ui/button"
import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { TextEditor } from "../TextEditor"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import { useUserContext } from "@/providers/UserContextProvider"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface GroupInfoSectionProps {
    groupId: string
}

export const GroupInfoSection = ({ groupId }: GroupInfoSectionProps) => {
    const supabase = createClientComponentClient<Database>()
    const [groupDescription, setGroupDescription] = useState<string>()
    const [isExpanded, setIsExpanded] = useState(false)
    const [isSetToEdit, setIsSetToEdit] = useState(false)
    const [membersId, setMembersId] = useState<string[]>()
    const [profileImageUrls, setProfileImageUrls] = useState<{ publicUrl: string }[]>([]);
    const queryClient = useQueryClient()
    const { userId } = useUserContext()
    const { ownerId } = useGroupOwnerContext()
    const router = useRouter()

    useQuery(['groups-description'], async () => {
        const { data, error } = await supabase
            .from("groups")
            .select("group_description")
            .eq("id", groupId)

        if (error) {
            throw error
        }

        if (data) {
            setGroupDescription(data[0].group_description as string)
        }
    },
        {
            cacheTime: 10 * 60 * 1000,
        })

    const editGroupDescriptionMutation = useMutation(
        async (newGroupDescription: string) => {
            const { data, error } = await supabase
                .from("groups")
                .update({ group_description: newGroupDescription })
                .eq("id", groupId)

            if (error) {
                throw error
            }

            if (data) {
                setIsSetToEdit(false)
            }
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('groups')
                toast({
                    title: "Success",
                    description: "Description updated successfully",
                });
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to update description",
                    variant: "destructive"
                });
            }
        })

    useEffect(() => {
        if (profileImages) {
            Promise.all(profileImages.map(async (image) => {
                const { data: publicURL } = await supabase.storage
                    .from('profile-pictures')
                    .getPublicUrl(image.image_url)

                return { publicUrl: publicURL.publicUrl };

            }))
                .then((publicUrls) => setProfileImageUrls(publicUrls))
                .catch(console.error);
        }
    }, [Image]);

    useQuery(['groups-description'], async () => {
        const { data, error } = await supabase
            .from("groups")
            .select("group_description")
            .eq("id", groupId)

        if (error) {
            throw error
        }

        if (data) {
            setGroupDescription(data[0].group_description as string)
        }
    },
        { cacheTime: 10 * 60 * 1000 })

    const groupMembers = useQuery(
        ['group-members-data'],
        async () => {
            const { data, error } = await supabase
                .from("group-members")
                .select(`users (*)`)
                .eq("group_id", groupId)
                .limit(4)

            if (error) {
                throw new Error(error.message)
            }

            if (data) {
                setMembersId(data.map((member) => member.users?.id as string))
            }
            return data
        },
        {
            enabled: !!groupId,
            cacheTime: 10 * 60 * 1000,
        })

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

    const memoizedGroupMembers = useMemo(() => groupMembers.data, [groupMembers.data]);

    return (
        <>
            <div className="flex gap-8">
                <div className="flex flex-col gap-4">
                    <h2 className='text-2xl font-bold'>Little bit about us</h2>
                    <div className='relative'>
                        {isSetToEdit === false && (
                            <>
                                <div
                                    dangerouslySetInnerHTML={{ __html: groupDescription as string }}
                                    className={`overflow-hidden ${isExpanded ? 'max-h-full' : 'max-h-24'} ${!isExpanded && 'blur-effect'}`}
                                ></div>
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className='text-blue-500'>
                                    {isExpanded ? 'Show less' : 'Show more'}
                                </button>
                            </>
                        ) || (

                                <div className="flex flex-col gap-4">
                                    <TextEditor
                                        editorContent={groupDescription as string}
                                        onChange={setGroupDescription}
                                    />
                                    <Button onClick={() => setIsSetToEdit(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={() => {
                                        editGroupDescriptionMutation.mutate(groupDescription as string)

                                        setIsSetToEdit(false)
                                    }}>
                                        Save changes
                                    </Button>
                                </div>
                            )}
                    </div>
                    {window.location.pathname.includes("/dashboard") && userId === ownerId && !isSetToEdit && (
                        <div className="flex gap-4">
                            <Button onClick={() => setIsSetToEdit(true)}>
                                Edit
                            </Button>
                        </div>
                    )}

                </div>
                <div className="flex flex-col gap-4">
                    <h2 className='text-2xl font-bold'>Members</h2>
                    <div className='grid grid-cols-4'>
                        {memoizedGroupMembers?.slice(0, 3).map((member) => (
                            <Link href={`/user-profile/${member.users?.id}`} key={member.users?.id}>
                                <div key={member.users?.id}
                                    className='flex flex-col gap-2 items-center border p-4 rounded-lg'>
                                    <Image className="rounded-full shadow-xl"
                                        src={profileImageUrls[0]?.publicUrl} width={50} height={50} alt="" />
                                    <span className=''>{member.users?.full_name}</span>
                                    {member.users?.id === membersId && (
                                        <span className='text-sm text-red-500'>Host</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                        {memoizedGroupMembers && memoizedGroupMembers?.length > 3 && (
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/group-members/${groupId}`)}
                            >
                                More
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <Toaster />
        </>
    )
}