"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { SocialMediaTypes } from "@/types/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Facebook, Instagram, Twitter } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";

export const EditSocialsDialog = () => {
    const [isOpen, setIsOpen] = useState(false);
    const supabase = createClientComponentClient<Database>();
    const { userId } = useUserContext();
    const [socials, setSocials] = useState<Record<string, Record<string, string>>>({})
    const queryClient = useQueryClient();
    const socialMediaIcons: Record<SocialMediaTypes, JSX.Element> = {
        Facebook: <Facebook />,
        Instagram: <Instagram />,
        Twitter: <Twitter />,
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
                })
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'There was an error updating your socials',
                    variant: 'destructive'
                })
            }
        }
    );

    const handleSocialChange = (social: string, socialsType: string, event: React.ChangeEvent<HTMLInputElement>) => {
        setSocials(prevState => ({
            ...prevState,
            [social]: {
                ...(prevState[social] || {}),
                [socialsType]: event.target.value,
            },
        }));
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button>Edit socials</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete event</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this event? If not please close this dialog.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4">
                        {Object.keys(socialMediaIcons).map((social) => {
                            const Icon = socialMediaIcons[social as SocialMediaTypes];

                            return (
                                <div className="flex items-center gap-4 cursor-pointer" key={social}>
                                    <label className="text-2xl" htmlFor={social}>{Icon}</label>
                                    <Input id={social}
                                        type="text"
                                        onChange={(e) => handleSocialChange(social, 'link', e)}
                                        placeholder={`${social} link...`}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    <DialogFooter>
                        <Button variant="destructive"
                            type="submit"
                            onClick={() => {
                                editSocialsMutation.mutate();
                                queryClient.invalidateQueries('users');
                                setIsOpen(false);
                            }}>
                            Update socials
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}