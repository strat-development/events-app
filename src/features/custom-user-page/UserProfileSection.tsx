"use client"

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
import { Brain, Facebook, Github, Globe, Instagram, Languages, Linkedin, Save, Twitter, X, Youtube } from "lucide-react";
import Link from "next/link";
import { TextEditor } from "@/features/TextEditor";
import { Button } from "../../components/ui/button";
import { toast } from "../../components/ui/use-toast";
import { UpdateUserImageDialog } from "@/components/dashboard/modals/user-profile/UpdateUserImageDialog";
import { IconBrandTiktok, IconGhost2Filled } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { FaXTwitter } from "react-icons/fa6";

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
    const [translatedBio, setTranslatedBio] = useState<string>();
    const [showTranslatedBio, setShowTranslatedBio] = useState(false);
    const [isSetToEdit, setIsSetToEdit] = useState(false)
    const [isTranslating, setIsTranslating] = useState(false);
    const socialMediaIcons: Record<SocialMediaTypes, JSX.Element> = {
        TikTok: <IconBrandTiktok className="text-white/70" />,
        Instagram: <Instagram className="text-white/70" />,
        X: <FaXTwitter className="text-white/70" />,
        YouTube: <Youtube className="text-white/70" />,
        PersonalWebsite: <Globe className="text-white/70" />,
        LinkedIn: <Linkedin className="text-white/70" />,
        GitHub: <Github className="text-white/70" />,
    };

    const translateRequest = async (description: string) => {
        try {
            setIsTranslating(true);
            const response = await fetch("/api/text-translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description }),
            });

            if (!response.ok) throw new Error("Translation request failed");

            const data = await response.json();
            setTranslatedBio(data.translatedText);
            setShowTranslatedBio(true);
            return data.translatedText;
        } catch (error) {
            console.error("Error in translateRequest:", error);
        } finally {
            setIsTranslating(false);
        }
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
                            <div className="flex flex-col relative items-center aspect-square gap-4 w-full border border-white/10 rounded-xl">
                                {imageUrls.length > 0 && imageUrls.some(image => image.publicUrl) ? (
                                    imageUrls.map((image, index) =>
                                        image.publicUrl ? (
                                            <Image
                                                key={index}
                                                src={image.publicUrl}
                                                alt="Profile picture"
                                                width={2000}
                                                height={2000}
                                                className="rounded-xl"
                                            />
                                        ) : null
                                    )
                                ) : (
                                    <div className="w-full h-full flex flex-col gap-2 items-center justify-center rounded-xl bg-white/5">
                                        <IconGhost2Filled className="w-24 h-24 text-white/70" strokeWidth={1} />
                                        <p className="text-white/50 text-lg">No profile picture</p>
                                    </div>
                                )}

                                {pathname === "/dashboard" && imageUrls.length > 0 && imageUrls.some(image => image.publicUrl) && (
                                    <DeleteUserProfileImageDialog />
                                )}

                                <div className="flex flex-col gap-4 absolute bottom-0 w-full pl-2 pb-2">
                                    <div className="absolute inset-0 bg-[#000]/20 blur-sm"></div>
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
                                <>
                                    {!translatedBio && (
                                        <Button
                                            className="w-fit text-white/70 self-end"
                                            variant="ghost"
                                            onClick={() => {
                                                translateRequest(user.user_bio as string);
                                            }}
                                            disabled={isTranslating}
                                        >
                                            <Languages size={20} />
                                        </Button>
                                    ) || (
                                            <Button
                                                className="w-fit self-end flex gap-2 text-white/70"
                                                variant="ghost"
                                                onClick={() => setShowTranslatedBio(!showTranslatedBio)}
                                            >
                                                <Languages size={20} /> {showTranslatedBio ? "Show Original" : "Show Translation"}
                                            </Button>
                                        )}

                                    {isTranslating ? (
                                        <div className="flex items-center justify-center">
                                            <BackgroundGradientAnimation className="w-full min-h-[320px] rounded-xl">
                                                <div className="flex w-full h-full bg-black/20 flex-col gap-2 items-center justify-center absolute transform left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2">
                                                    <Brain className="w-24 h-24 bg-metallic-gradient bg-clip-text text-white/70"
                                                        strokeWidth={2} />
                                                    <TextGenerateEffect className="text-white/70" words="Translating..." />
                                                </div>

                                                <div className="p-4 blur-sm opacity-70" dangerouslySetInnerHTML={{ __html: user.user_bio as string }}></div>
                                            </BackgroundGradientAnimation>
                                        </div>
                                    ) : showTranslatedBio === false ? (
                                        <div dangerouslySetInnerHTML={{ __html: user.user_bio as string }}></div>
                                    ) : (
                                        <div dangerouslySetInnerHTML={{ __html: translatedBio as string }}></div>
                                    )}

                                </>
                            ) || (
                                    <div className="flex flex-col gap-4 ">
                                        <TextEditor
                                            editorContent={user.user_bio as string}
                                            onChange={setUserBio}
                                        />
                                        <div className="flex gap-4">
                                            <Button variant="ghost"
                                                className="text-red-500"
                                                onClick={() => setIsSetToEdit(false)}>
                                                <X size={20} />
                                            </Button>
                                            <Button variant="ghost"
                                                className="w-fit text-blue-500"
                                                onClick={() => {
                                                    editUserBioMutation.mutate(userBio as string)

                                                    setIsSetToEdit(false)
                                                }}>
                                                <Save size={20} />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            {!isSetToEdit &&
                                pathname === "/dashboard" && (
                                    <div className="flex gap-4">
                                        <Button variant="ghost"
                                            onClick={() => setIsSetToEdit(true)}>
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
                        {pathname === "/dashboard" && (
                            <EditSocialsDialog />
                        )}
                    </div>

                </div>
            )}

            {!userRole && userId && (
                <UserDataModal />
            )}

            <Toaster />
        </>
    )
}

