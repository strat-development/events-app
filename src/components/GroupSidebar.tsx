"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { GroupData } from "@/types/types";
import Image from "next/image";
import { ArrowUpRight, Brain, ChevronsRight, Files, Languages, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { usePathname, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { useUserContext } from "@/providers/UserContextProvider";
import { useState } from "react";
import { toast } from "./ui/use-toast";
import { IconGhost2Filled } from "@tabler/icons-react";
import { BackgroundGradientAnimation } from "./ui/background-gradient-animation";
import { TextGenerateEffect } from "./ui/text-generate-effect";

interface GroupSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    selectedGroup: GroupData | null;
    imageUrl: string | null;
}

export const GroupSidebar = ({ isOpen, onClose, selectedGroup, imageUrl }: GroupSidebarProps) => {
    const router = useRouter()
    const supabase = createClientComponentClient<Database>()
    const queryClient = useQueryClient()
    const { userId, userEmail, userName } = useUserContext()
    const groupId = selectedGroup?.id
    const pathname = usePathname();
    const [member, setMemberData] = useState<string[]>([])
    const [translatedGroupDescription, setTranslatedGroupDescription] = useState<string>()
    const [showTranslatedDescription, setShowTranslatedDescription] = useState(false)
    const [isTranslating, setIsTranslating] = useState(false);

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
            setTranslatedGroupDescription(data.translatedText);
            setShowTranslatedDescription(true);

            return data.translatedText;
        } catch (error) {
            console.error("Error in translateRequest:", error);
        } finally {
            setIsTranslating(false);
        }
    };

    const fetchAttendee = useQuery(['attendee'], async () => {
        const { data, error } = await supabase
            .from("group-members")
            .select("*")
            .eq("user_id", userId)
            .eq("group_id", selectedGroup?.id || "")

        if (error) {
            throw error
        }

        if (data) {
            setMemberData(data as unknown as string[])
        }

        return data
    },
        {
            enabled: !!userId && !!selectedGroup?.id,
            cacheTime: 10 * 60 * 1000,
        })

    const leaveGroupMutation = useMutation(
        async () => {
            const { data, error } = await supabase
                .from('group-members')
                .delete()
                .eq('group_id', groupId || "")
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
    if (!isOpen) return null;

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay
                    className={cn(
                        "fixed inset-0 z-[99999] bg-[#131414]/50 backdrop-blur-xl",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                    )}
                />

                <DialogPrimitive.Content
                    className={cn(
                        "overflow-y-auto min-[480px]:m-4 fixed inset-y-0 right-0 border-white/10 border-[1px] min-[480px]:rounded-2xl z-[9999999999999] max-w-[480px] w-full bg-[#131414] shadow-lg",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
                    )}
                >
                    <div className="flex flex-col gap-4 p-4 items-center">
                        <div className="flex gap-2 justify-start w-full">
                            <Button className="text-white/70"
                                variant="ghost" onClick={onClose}>
                                <ChevronsRight size={16} />
                            </Button>
                            <div className="flex gap-2">
                                <Button className="text-white/70 flex gap-2"
                                    variant="ghost"
                                    onClick={() => navigator.clipboard.writeText(`https://huddle.net.pl/group-page/${selectedGroup?.id}`)}>
                                    <Files size={16} /> Copy link
                                </Button>
                                <Button className="text-white/70 flex gap-2"
                                    variant="ghost"
                                    onClick={() => {
                                        { pathname.includes("dashboard") ? router.push(`/dashboard/group-page/${selectedGroup?.id}`) : router.push(`/group-page/${selectedGroup?.id}`) }
                                    }}>
                                    <ArrowUpRight size={16} /> Visit group page
                                </Button>
                            </div>
                        </div>
                        <div className="flex w-full flex-col items-center gap-4">
                            {imageUrl ? (
                                <Image
                                    src={imageUrl}
                                    alt="Profile picture"
                                    width={2000}
                                    height={2000}
                                    className="rounded-xl w-[280px] h-[280px] object-cover"
                                />
                            ) : (
                                <div className="w-[280px] h-[280px] flex flex-col gap-2 items-center justify-center rounded-xl bg-white/5">
                                    <IconGhost2Filled className="w-24 h-24 text-white/70" strokeWidth={1} />
                                    <p className="text-white/50 text-lg">No picture available</p>
                                </div>
                            )}
                            <h2 className="text-2xl self-start font-bold text-white/70">{selectedGroup?.group_name}</h2>
                        </div>
                        <div className="flex w-full justify-start gap-8">
                            <div className="flex flex-wrap gap-4">
                                <div className="flex flex-col items-center border-[1px] rounded-xl w-12 h-12">
                                    <div className="text-white/70 uppercase text-xs text-center font-bold bg-white/10 w-full rounded-t-xl">
                                        {format(parseISO(selectedGroup?.created_at as string), 'MMM')}
                                    </div>
                                    <span className="text-white/50 text-lg font-semibold">
                                        {format(parseISO(selectedGroup?.created_at as string), 'd')}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-white/70 font-medium">{format(parseISO(selectedGroup?.created_at as string), 'dd MMM, yyyy')}</p>
                                    <p className="text-white/50 text-sm">Created at</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex flex-col justify-center items-center border-[1px] rounded-xl w-12 h-12">
                                    <MapPin className="text-white/70" size={24} />
                                </div>
                                <div className="flex flex-col">
                                    {selectedGroup?.group_country && (
                                        <>
                                            <p className="text-white/70 font-medium">
                                                {selectedGroup.group_city ? selectedGroup.group_city.split(', ')[0] || "Unknown City" : "Unknown City"}
                                            </p>
                                            <p className="text-white/50 text-sm">
                                                {selectedGroup.group_country.split(', ')[0] || "Unknown Street"}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="w-full bg-white/10 rounded-2xl">
                            <div className="w-full bg-white/10 px-4 py-2 rounded-t-2xl">
                                <p className="text-white/70 font-semibold">Join group</p>
                            </div>
                            <div className="flex flex-col gap-2 p-4 text-white/50">
                                Welcome to {selectedGroup?.group_name}! Join us to have a fun time.
                                <div className="flex flex-wrap gap-2">
                                    <p className="font-semibold text-white/70 truncate">{userName}</p>
                                    <p className="font-semibold text-white/50 truncate">{userEmail}</p>
                                </div>
                                {!member && (
                                    <Button className="mt-4" variant="default" onClick={() => {
                                        joinGroupMutation.mutateAsync()
                                    }}>
                                        Join group
                                    </Button>
                                ) || (
                                        <Button className="mt-4" variant="destructive" onClick={() => {
                                            leaveGroupMutation.mutateAsync()
                                        }}>
                                            Leave group
                                        </Button>
                                    )}
                            </div>
                        </div>
                        <div className="w-full flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <p className="text-white/70 font-semibold">About</p>
                                <hr />
                            </div>
                            {!translatedGroupDescription && (
                                <Button className="w-fit text-white/70 self-end"
                                    variant="ghost"
                                    onClick={() => {
                                        translateRequest(selectedGroup?.group_description as string)
                                    }}>
                                    <Languages size={20} />
                                </Button>
                            ) || (
                                    <Button
                                        className="w-fit self-end flex gap-2 text-white/70"
                                        variant="ghost"
                                        onClick={() => setShowTranslatedDescription(!setShowTranslatedDescription)}
                                    >
                                        <Languages size={20} /> {showTranslatedDescription ? "Show Original" : "Show Translation"}
                                    </Button>
                                )}

                            {isTranslating ? (
                                <div className="flex items-center justify-center">
                                    <BackgroundGradientAnimation
                                        className="w-full min-h-[320px] rounded-xl">
                                        <div className="flex w-full h-full bg-black/20 flex-col gap-2 items-center justify-center absolute transform left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2">
                                            <Brain className="w-24 h-24 bg-metallic-gradient bg-clip-text text-white/70"
                                                strokeWidth={2} />
                                            <TextGenerateEffect className="text-white/70" words="Translating..." />
                                        </div>

                                        <div className="p-4 blur-sm opacity-70" dangerouslySetInnerHTML={{ __html: selectedGroup?.group_description as string }}></div>
                                    </BackgroundGradientAnimation>
                                </div>
                            ) : showTranslatedDescription === false ? (
                                <div dangerouslySetInnerHTML={{ __html: selectedGroup?.group_description as string }}></div>
                            ) : (
                                <div dangerouslySetInnerHTML={{ __html: translatedGroupDescription as string }}></div>
                            )}
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};