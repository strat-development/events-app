"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { UserData } from "@/types/types";
import Image from "next/image";
import { ArrowUpRight, Brain, ChevronsRight, Files, Languages, MapPin } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { useQuery } from "react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { IconGhost2Filled } from "@tabler/icons-react";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { BackgroundGradientAnimation } from "./ui/background-gradient-animation";
import { TextGenerateEffect } from "./ui/text-generate-effect";

interface UserProfileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    selectedUser: UserData | null;
    imageUrl: string | null;
}

export const UserProfileSidebar = ({ isOpen, onClose, selectedUser, imageUrl }: UserProfileSidebarProps) => {
    const router = useRouter()
    const pathname = usePathname();
    const [userInterests, setUserInterests] = useState<string[]>([])
    const { userId } = useUserContext();
    const supabase = createClientComponentClient<Database>()
    const [translatedBio, setTranslatedBio] = useState<string>();
    const [showTranslatedBio, setShowTranslatedBio] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);

    useQuery("userInterests", async () => {
        if (!userId) return
        const { data, error } = await supabase
            .from("users")
            .select("user_interests")
            .eq("id", userId)
        if (error) {
            throw error
        }

        if (data && data.length > 0) {
            setUserInterests(data[0].user_interests as string[])
        }

        return data
    }, {
        enabled: !!userId,
        cacheTime: 10 * 60 * 1000,
    })

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

    const memoizedUserInterests = useMemo(() => userInterests, [userInterests])

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
                                    onClick={() => navigator.clipboard.writeText(`https://${window.location.host}/user-profile/${selectedUser?.id}`)}>
                                    <Files size={16} /> Copy link
                                </Button>
                                <Button className="text-white/70 flex gap-2"
                                    variant="ghost"
                                    onClick={() => {
                                        { pathname.includes("dashboard") ? router.push(`/dashboard/user-profile/${selectedUser?.id}`) : router.push(`/user-profile/${selectedUser?.id}`) }
                                    }}>
                                    <ArrowUpRight size={16} /> Visit user page
                                </Button>
                            </div>
                        </div>
                        <div className="flex w-full flex-col items-center gap-4">

                            {imageUrl && (
                                <Image
                                    src={imageUrl || ""}
                                    alt="Profile picture"
                                    width={2000}
                                    height={2000}
                                    className="rounded-xl aspect-square object-cover w-[280px] h-[280px]"
                                />
                            ) || (
                                    <div className="w-[280px] h-[280px] flex flex-col gap-2 items-center justify-center rounded-xl bg-white/5">
                                        <IconGhost2Filled className="w-24 h-24 text-white/70" strokeWidth={1} />
                                        <p className="text-white/50 text-lg">No profile picture</p>
                                    </div>
                                )}

                            <h2 className="text-2xl self-start font-bold text-white/70">{selectedUser?.full_name}</h2>
                        </div>
                        <div className="flex w-full justify-start gap-8">
                            <div className="flex flex-wrap gap-4">
                                <div className="flex flex-col items-center border-[1px] rounded-xl w-12 h-12">
                                    <div className="text-white/70 uppercase text-xs text-center font-bold bg-white/10 w-full rounded-t-xl">
                                        {format(parseISO(selectedUser?.joined_at as string), 'MMM',)}
                                    </div>
                                    <span className="text-white/50 text-lg font-semibold">
                                        {format(parseISO(selectedUser?.joined_at as string), 'd',)}
                                    </span>
                                </div>
                                <div className="flex flex-col text-white/50">
                                    Joined
                                    <p className="font-medium text-white/70">{format(parseISO(selectedUser?.joined_at as string), 'EEEE, dd MMM',)}</p>
                                </div>

                            </div>
                            <div className="flex gap-4">
                                <div className="flex flex-col justify-center items-center border-[1px] rounded-xl w-12 h-12">
                                    <MapPin className="text-white/70" size={24} />
                                </div>
                                <div className="flex flex-col">
                                    {selectedUser?.country && selectedUser?.city && (
                                        <>
                                            <p className="text-white/70 font-medium">
                                                {selectedUser.city.split(', ')[0] || "Unknown City"}
                                            </p>
                                            <p className="text-white/50 text-sm">
                                                {selectedUser.country.split(', ')[1] || "Unknown Country"}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="w-full flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <p className="text-white/70 font-semibold">About</p>
                                <hr />
                            </div>
                            {!translatedBio && (
                                <Button className="w-fit text-white/70 self-end"
                                    variant="ghost"
                                    onClick={() => {
                                        translateRequest(selectedUser?.user_bio as string)
                                    }}>
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

                                        <div className="p-4 blur-sm opacity-70" dangerouslySetInnerHTML={{ __html: selectedUser?.user_bio as string }}></div>
                                    </BackgroundGradientAnimation>
                                </div>
                            ) : showTranslatedBio === false ? (
                                <div dangerouslySetInnerHTML={{ __html: selectedUser?.user_bio as string }}></div>
                            ) : (
                                <div dangerouslySetInnerHTML={{ __html: translatedBio as string }}></div>
                            )}
                            <div className="flex flex-wrap gap-4">
                                {memoizedUserInterests && (
                                    memoizedUserInterests.map((interest, index) => (
                                        <div key={index}
                                            className="border border-white/10 bg-gradient-to-br text-white/70 hover:text-white/80 text-sm py-1 px-2 transition duration-300 rounded-xl cursor-pointer hover:shadow-lg hover:shadow-white/5 max-w-[148px] w-fit">
                                            <p className="tracking-wide font-medium truncate"
                                                key={index}>{interest}</p>
                                        </div>
                                    )))}
                            </div>
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};