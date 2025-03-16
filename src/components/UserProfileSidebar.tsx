"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { UserData } from "@/types/types";
import Image from "next/image";
import { ArrowUpRight, ChevronsRight, Files, MapPin } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { useQuery, useQueryClient } from "react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { useUserContext } from "@/providers/UserContextProvider";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconGhost2Filled } from "@tabler/icons-react";

interface UserProfileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    selectedUser: UserData | null;
    imageUrl: string | null;
}

export const UserProfileSidebar = ({ isOpen, onClose, selectedUser, imageUrl }: UserProfileSidebarProps) => {
    const router = useRouter()
    const pathname = usePathname();

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
                                    className="rounded-xl w-[280px] h-[280px]"
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
                            <div dangerouslySetInnerHTML={{ __html: selectedUser?.user_bio || "" }}></div>
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};