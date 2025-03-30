"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { SocialMediaTypes } from "@/types/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { IconBrandTiktok } from "@tabler/icons-react";
import { Github, Globe, Instagram, Linkedin, Save, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { FaXTwitter } from "react-icons/fa6";

export const EditSocialsDialog = () => {
    const [isOpen, setIsOpen] = useState(false);
    const supabase = createClientComponentClient<Database>();
    const { userId } = useUserContext();
    const queryClient = useQueryClient();

    const [socials, setSocials] = useState<Record<string, { link: string; rawInput?: string }>>({});
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    const socialMediaIcons: Record<SocialMediaTypes, JSX.Element> = {
        TikTok: <IconBrandTiktok className="text-white/70" />,
        Instagram: <Instagram className="text-white/70" />,
        X: <FaXTwitter className="text-white/70" />,
        YouTube: <Youtube className="text-white/70" />,
        PersonalWebsite: <Globe className="text-white/70" />,
        LinkedIn: <Linkedin className="text-white/70" />,
        GitHub: <Github className="text-white/70" />
    };

    const validSocialDomains: Record<SocialMediaTypes, RegExp> = {
        TikTok: /^(https?:\/\/)?(www\.)?tiktok\.com\/[\w.-]+\/?$/,
        Instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/[\w.-]+\/?$/,
        X: /^(https?:\/\/)?(www\.)?(x\.com|twitter\.com)\/[\w.-]+\/?$/,
        YouTube: /^(https?:\/\/)?(www\.)?youtube\.com\/[\w.-]+\/?$/,
        PersonalWebsite: /^(https?:\/\/)?(www\.)?[\w.-]+\.[a-z]{2,}\/?$/,
        LinkedIn: /^(https?:\/\/)?(www\.)?linkedin\.com\/[\w.-]+\/?$/,
        GitHub: /^(https?:\/\/)?(www\.)?github\.com\/[\w.-]+\/?$/,
    };

    const isValidInput = (input: string, social: SocialMediaTypes): boolean => {
        if (social === "PersonalWebsite") {
            try {
                const parsedUrl = new URL(input.startsWith("https://") ? input : `https://${input}`);
                return validSocialDomains[social].test(parsedUrl.href);
            } catch {
                return false;
            }
        }


        return /^[\w.-]+$/.test(input);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            const newErrors: Record<string, boolean> = {};

            Object.entries(socials).forEach(([social, { rawInput }]) => {
                if (rawInput && !isValidInput(rawInput, social as SocialMediaTypes)) {
                    newErrors[social] = true;
                }
            });

            setErrors(newErrors);
        }, 300);

        return () => clearTimeout(timer);
    }, [socials]);

    
    const handleSocialChange = (social: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const username = event.target.value;
        const domain = getSocialDomain(social as SocialMediaTypes);
        const fullUrl = username ? `https://${domain}${username}` : "";
        const value = event.target.value;

        setSocials(prev => ({
            ...prev,
            [social]: {
                link: fullUrl,
                rawInput: value
            }
        }));
    };

    const editSocialsMutation = useMutation(
        async () => {
            const socialsToSave = Object.fromEntries(
                Object.entries(socials).map(([social, { rawInput }]) => {
                    const domain = getSocialDomain(social as SocialMediaTypes);
                    const fullUrl = rawInput ? `https://${domain}${rawInput}` : "";
                    return [social, { link: fullUrl }];
                })
            );

            await supabase
                .from('users')
                .update({
                    social_media: JSON.stringify(socialsToSave)
                })
                .eq('id', userId);
        },
        {
            onSuccess: () => {
                toast({
                    title: 'Socials updated',
                    description: 'Your socials have been updated successfully'
                });

                queryClient.invalidateQueries('users');
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'There was an error updating your socials',
                    variant: 'destructive'
                });
            }
        }
    );

    const getSocialDomain = (social: SocialMediaTypes): string => {
        switch (social) {
            case "Instagram":
                return "instagram.com/";
            case "TikTok":
                return "tiktok.com/@";
            case "X":
                return "x.com/";
            case "YouTube":
                return "youtube.com/";
            case "LinkedIn":
                return "linkedin.com/in/";
            case "GitHub":
                return "github.com/";
            case "PersonalWebsite":
                return "";
            default:
                return "";
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost"
                    className="w-fit">Edit socials</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[425px]">
                {Object.keys(socialMediaIcons).map((social) => {
                    const Icon = socialMediaIcons[social as SocialMediaTypes];

                    return (
                        <div className="flex flex-col gap-2" key={social}>
                            <div className="flex items-center gap-4">
                                <label className="text-2xl" htmlFor={social}>
                                    {Icon}
                                </label>
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="flex items-center">
                                        <span className="flex items-center justify-center text-white/70 bg-gray-100/10  px-2 h-[40px] rounded-l-xl border border-r-0 border-gray-100/5 dark:border-gray-600 text-sm">
                                            {getSocialDomain(social as SocialMediaTypes)}
                                        </span>
                                        <Input
                                            id={social}
                                            type="text"
                                            value={socials[social]?.rawInput || ""}
                                            onChange={(e) => handleSocialChange(social, e)}
                                            placeholder={
                                                social === "PersonalWebsite"
                                                    ? "Paste your website link"
                                                    : `Enter your ${social} username`
                                            }
                                            className={`rounded-l-none ${errors[social] ? "border-red-500" : ""}`}
                                        />
                                    </div>
                                    {
                                        errors[social] && (
                                            <p className="text-red-500 text-sm">
                                                {social === "PersonalWebsite"
                                                    ? "Please enter a valid website URL"
                                                    : `Please enter a valid ${social} username`}
                                            </p>
                                        )
                                    }
                                </div>
                            </div>
                        </div>
                    );
                })}

                <DialogFooter>
                    <Button variant="ghost"
                        className="text-blue-500"
                        onClick={() => {
                            if (Object.values(errors).some(error => error)) {
                                toast({
                                    title: "Invalid URLs",
                                    description: "Please enter correct TikTok, Instagram, and X links.",
                                    variant: "destructive",
                                });
                                return;
                            }

                            editSocialsMutation.mutate();
                            setIsOpen(false);
                        }}>
                        <Save size={20} />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
