"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { SocialMediaTypes } from "@/types/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Facebook, Instagram, Twitter } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";

export const EditSocialsDialog = () => {
    const [isOpen, setIsOpen] = useState(false);
    const supabase = createClientComponentClient<Database>();
    const { userId } = useUserContext();
    const queryClient = useQueryClient();

    const [socials, setSocials] = useState<Record<string, { link: string }>>({});
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    const socialMediaIcons: Record<SocialMediaTypes, JSX.Element> = {
        Facebook: <Facebook />,
        Instagram: <Instagram />,
        X: <Twitter />,
    };

    const validSocialDomains: Record<SocialMediaTypes, RegExp> = {
        Facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/[\w.-]+\/?$/,
        Instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/[\w.-]+\/?$/,
        X: /^(https?:\/\/)?(www\.)?(x\.com|twitter\.com)\/[\w.-]+\/?$/
    };

    const isValidSocialUrl = (url: string, social: SocialMediaTypes) => {
        try {
            const parsedUrl = new URL(url);
            return validSocialDomains[social].test(parsedUrl.href);
        } catch (_) {
            return false;
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            const newErrors: Record<string, boolean> = {};

            Object.entries(socials).forEach(([social, { link }]) => {
                if (link && !isValidSocialUrl(link, social as SocialMediaTypes)) {
                    newErrors[social] = true;
                }
            });

            setErrors(newErrors);
        }, 300);

        return () => clearTimeout(timer);
    }, [socials]);

    const handleSocialChange = (social: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;

        setSocials(prev => ({
            ...prev,
            [social]: { link: value }
        }));

        setErrors(prev => ({
            ...prev,
            [social]: false
        }));
    };

    const editSocialsMutation = useMutation(
        async () => {
            await supabase
                .from('users')
                .update({
                    social_media: JSON.stringify(socials)
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

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="w-fit">Edit socials</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit socials</DialogTitle>
                    <DialogDescription className="text-white/70">
                        Are you sure you want to delete your socials? If not please close this dialog.
                    </DialogDescription>
                </DialogHeader>

                {Object.keys(socialMediaIcons).map((social) => {
                    const Icon = socialMediaIcons[social as SocialMediaTypes];

                    return (
                        <div className="flex flex-col gap-2" key={social}>
                            <div className="flex items-center gap-4">
                                <label className="text-2xl" htmlFor={social}>{Icon}</label>
                                <div className="flex flex-col gap-1 w-full">
                                    <Input
                                        id={social}
                                        type="text"
                                        value={socials[social]?.link || ""}
                                        onChange={(e) => handleSocialChange(social, e)}
                                        placeholder={`${social} link...`}
                                        className={errors[social] ? "border-red-500" : ""}
                                    />
                                    {errors[social] && (
                                        <p className="text-red-500 text-sm">
                                            Invalid {social} URL. Please enter a valid link.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                <DialogFooter>
                    <HoverBorderGradient
                        onClick={() => {
                            if (Object.values(errors).some(error => error)) {
                                toast({
                                    title: "Invalid URLs",
                                    description: "Please enter correct Facebook, Instagram, and X links.",
                                    variant: "destructive",
                                });
                                return;
                            }

                            editSocialsMutation.mutate();
                            setIsOpen(false);
                        }}>
                        Update socials
                    </HoverBorderGradient>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
