"use client"

import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useMutation, useQuery } from "react-query";
import { Toaster } from "../../components/ui/toaster";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { EditUserProfileDialog } from "../../components/dashboard/modals/EditUserProfileDialog";
import { UserDataModal } from "../../components/dashboard/modals/UserDataDialog";
import { DeleteUserProfileImageDialog } from "../../components/dashboard/modals/DeleteUserProfileImageDialog";
import { EditSocialsDialog } from "../../components/dashboard/modals/EditSocialsDialog";
import { SocialMediaTypes } from "@/types/types";
import { Facebook, Instagram, Twitter } from "lucide-react";
import Link from "next/link";
import { TextEditor } from "@/features/TextEditor";
import { Button } from "../../components/ui/button";
import { toast } from "../../components/ui/use-toast";

interface UserProfileSectionProps {
    userId: string;
    userRole?: string;
}

export const UserProfileSection = ({ userId, userRole }: UserProfileSectionProps) => {
    const supabase = createClientComponentClient<Database>();

    const [imageUrls, setImageUrls] = useState<{ publicUrl: string }[]>([]);
    const [userBio, setUserBio] = useState<string>();
    const [isSetToEdit, setIsSetToEdit] = useState(false)
    const socialMediaIcons: Record<SocialMediaTypes, JSX.Element> = {
        Facebook: <Facebook />,
        Instagram: <Instagram />,
        Twitter: <Twitter />,
    };

    const { data: images, isLoading } = useQuery(
        ['profile-pictures', userId],
        async () => {
            const { data, error } = await supabase
                .from('profile-pictures')
                .select('*')
                .eq('user_id', userId)
            if (error) {
                throw error;
            }
            return data || [];
        },
        {
            enabled: !!userId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    useEffect(() => {
        if (images) {
            Promise.all(images.map(async (image) => {
                const { data: publicURL } = await supabase.storage
                    .from('profile-pictures')
                    .getPublicUrl(image.image_url)

                return { publicUrl: publicURL.publicUrl };

            }))
                .then((publicUrls) => setImageUrls(publicUrls))
                .catch(console.error);
        }
    }, [images]);

    const getUserData = useQuery(
        ['users'],
        async () => {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", userId)

            if (error) {
                throw error;
            }

            return data;
        },
        {
            enabled: !!userId,
            cacheTime: 10 * 60 * 1000,
        }
    )

    const editUserBioMutation = useMutation(
        async (newBio: string) => {
            const { error } = await supabase
                .from("users")
                .update({
                    user_bio: newBio
                })
                .eq("id", userId)

            if (error) {
                throw error;
            }
        },
        {
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to update bio",
                    variant: "destructive"
                });
            }
        })

    const { data: socials } = useQuery(
        ['socials'],
        async () => {
            const { data, error } = await supabase
                .from('users')
                .select('social_media')
                .eq('id', userId);
            if (error) {
                throw error;
            }
            return data?.[0];
        }, {
        enabled: !!userId,
        cacheTime: 10 * 60 * 1000,
    });

    const parsedSocials = typeof socials?.social_media === 'string' ? JSON.parse(socials.social_media) : {};
    const memoizedUserData = useMemo(() => getUserData, [getUserData]);
    

    return (
        <>
            <div className="flex flex-col gap-4">
                {memoizedUserData.data?.map((user) => (
                    <div className="flex flex-col gap-4"
                        key={user.id}>
                        <div className="flex flex-col gap-4">
                            <Image src={imageUrls[0]?.publicUrl} alt="profile picture" width={200} height={200} />
                            {window.location.pathname === "/dashboard" && (
                                <DeleteUserProfileImageDialog />
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <h2>{user.full_name}</h2>
                            <p>{user.email}</p>
                            <p>{user.city}, {user.country}</p>
                            {window.location.pathname === "/dashboard" && (
                                <EditUserProfileDialog />
                            )}

                        </div>

                        {isSetToEdit === false && (
                            <>
                                <div
                                    dangerouslySetInnerHTML={{ __html: user.user_bio as string }}></div>
                            </>
                        ) || (
                                <div className="flex flex-col gap-4">
                                    <TextEditor
                                        editorContent={user.user_bio as string}
                                        onChange={setUserBio}
                                    />
                                    <Button onClick={() => setIsSetToEdit(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={() => {
                                        editUserBioMutation.mutate(userBio as string)

                                        setIsSetToEdit(false)
                                    }}>
                                        Save changes
                                    </Button>
                                </div>
                            )}
                        {!isSetToEdit &&
                            window.location.pathname === "/dashboard" && (
                                <div className="flex gap-4">
                                    <Button onClick={() => setIsSetToEdit(true)}>
                                        Edit
                                    </Button>
                                </div>
                            )
                        }
                    </div>
                ))}



                <div className="flex gap-4">
                    {parsedSocials && Object.entries(parsedSocials).map(([socialsType, value]) => {
                        const socialsAsObj = value as { link: string };
                        const Icon = socialMediaIcons[socialsType as SocialMediaTypes];
                        return (
                            <div className="flex gap-4 items-center"
                                key={socialsType}>
                                {Icon && <Link href={socialsAsObj.link}>
                                    <div className="flex gap-4 items-center">
                                        {Icon}
                                        <h3>{socialsType}</h3>
                                    </div>
                                </Link>}
                            </div>
                        );
                    })}
                </div>
                {window.location.pathname === "/dashboard" && (
                    <EditSocialsDialog />
                )}
            </div>

            {!userRole && (
                <UserDataModal />
            )}

            <Toaster />
        </>
    )
}
