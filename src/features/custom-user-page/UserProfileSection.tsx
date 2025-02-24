"use client"

import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Toaster } from "../../components/ui/toaster";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { EditUserProfileDialog } from "../../components/dashboard/modals/user-profile/EditUserProfileDialog";
import { UserDataModal } from "../../components/dashboard/modals/user-profile/UserDataDialog";
import { DeleteUserProfileImageDialog } from "../../components/dashboard/modals/user-profile/DeleteUserProfileImageDialog";
import { EditSocialsDialog } from "../../components/dashboard/modals/user-profile/EditSocialsDialog";
import { SocialMediaTypes } from "@/types/types";
import { Facebook, Instagram, Twitter } from "lucide-react";
import Link from "next/link";
import { TextEditor } from "@/features/TextEditor";
import { Button } from "../../components/ui/button";
import { toast } from "../../components/ui/use-toast";
import { UpdateUserImageDialog } from "@/components/dashboard/modals/user-profile/UpdateUserImageDialog";
import { IconGhost2Filled } from "@tabler/icons-react";
import { usePathname } from "next/navigation";

interface UserProfileSectionProps {
    userId: string;
    userRole?: string;
}

export const UserProfileSection = ({ userId, userRole }: UserProfileSectionProps) => {
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();
    const pathname = usePathname();
    const [imageUrls, setImageUrls] = useState<{ publicUrl: string }[]>([]);
    const [userBio, setUserBio] = useState<string>();
    const [isSetToEdit, setIsSetToEdit] = useState(false)
    const socialMediaIcons: Record<SocialMediaTypes, JSX.Element> = {
        Facebook: <Facebook className="text-white/70" size={24} />,
        Instagram: <Instagram className="text-white/70" size={24} />,
        X: <Twitter className="text-white/70" size={24} />,
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
            Promise.all(
                images
                    .filter(image => image.image_url.trim() !== "")
                    .map(async (image) => {
                        const { data: publicURL } = await supabase.storage
                            .from('profile-pictures')
                            .getPublicUrl(image.image_url);
                        return { publicUrl: publicURL.publicUrl };
                    })
            )
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
            onSuccess: () => {
                toast({
                    title: "Success",
                    description: "Bio updated successfully"
                });

                queryClient.invalidateQueries(['users']);
            },

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
            {userId && (
                <div className="flex flex-col gap-4 min-[768px]:max-w-[480px] w-full">
                    {memoizedUserData.data?.map((user) => (
                        <div className="flex flex-col gap-4 w-full"
                            key={user.id}>
                            <div className="flex flex-col relative items-center aspect-square gap-4 w-full border border-white/10 rounded-md">
                                {imageUrls.length > 0 && imageUrls.some(image => image.publicUrl) ? (
                                    imageUrls.map((image, index) =>
                                        image.publicUrl ? (
                                            <Image
                                                key={index}
                                                src={image.publicUrl}
                                                alt="Profile picture"
                                                width={2000}
                                                height={2000}
                                                className="rounded-md"
                                            />
                                        ) : null
                                    )
                                ) : (
                                    <div className="w-full h-full flex flex-col gap-2 items-center justify-center rounded-md bg-white/5">
                                        <IconGhost2Filled className="w-24 h-24 text-white/70" strokeWidth={1} />
                                        <p className="text-white/50 text-lg">No profile picture</p>
                                    </div>
                                )}

                                {pathname === "/dashboard" && imageUrls.length > 0 && imageUrls.some(image => image.publicUrl) && (
                                    <DeleteUserProfileImageDialog />
                                )}

                                <div className="flex flex-col gap-4 absolute bottom-0 w-full pl-2 pb-2">
                                    <div className="absolute inset-0 bg-black/30 blur-sm"></div>
                                    <div className="relative flex flex-col gap-1">
                                        <h2 className="text-xl font-bold tracking-wider">{user.full_name}</h2>
                                        <p className="text-lg text-white/70">{user.email}</p>
                                        <p className="text-white/50">{user.city}, {user.country}</p>
                                    </div>

                                    {pathname === "/dashboard" && (
                                        <div className="relative flex gap-2">
                                            <EditUserProfileDialog />
                                            <UpdateUserImageDialog />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isSetToEdit === false && (
                                <div dangerouslySetInnerHTML={{ __html: user.user_bio as string }}></div>
                            ) || (
                                    <div className="flex flex-col gap-4 ">
                                        <TextEditor
                                            editorContent={user.user_bio as string}
                                            onChange={setUserBio}
                                        />
                                        <Button variant="outline"
                                            onClick={() => setIsSetToEdit(false)}>
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
                                pathname === "/dashboard" && (
                                    <div className="flex gap-4">
                                        <Button onClick={() => setIsSetToEdit(true)}>
                                            Edit BIO
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
                                        </div>
                                    </Link>}
                                </div>
                            );
                        })}
                    </div>
                    {pathname === "/dashboard" && (
                        <EditSocialsDialog />
                    )}
                </div>
            )}

            {!userRole && userId && (
                <UserDataModal />
            )}

            <Toaster />
        </>
    )
}

