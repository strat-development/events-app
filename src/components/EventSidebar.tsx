"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { AttendeesData, EventData } from "@/types/types";
import Image from "next/image";
import { ArrowUpRight, ChevronsRight, Files, Languages, MapPin } from "lucide-react";
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

interface EventSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    selectedEvent: EventData | null;
    imageUrl: string | null;
}

export const EventSidebar = ({ isOpen, onClose, selectedEvent, imageUrl }: EventSidebarProps) => {
    const router = useRouter()
    const supabase = createClientComponentClient<Database>()
    const queryClient = useQueryClient()
    const { userId, userEmail, userName } = useUserContext()
    const groupId = selectedEvent?.event_group
    const [groupName, setGroupName] = useState<string>("")
    const pathname = usePathname();
    const [attendeeData, setAttendeeData] = useState<AttendeesData[]>([])
    const [translatedEventDescription, setTranslatedEventDescription] = useState<string>()
    const [showTranslatedDescription, setShowTranslatedDescription] = useState(false)

    const groupData = useQuery(
        ["group", groupId],
        async () => {
            const { data, error } = await supabase
                .from("groups")
                .select("group_name")
                .eq('id', groupId || "")

            if (error) {
                console.error("Error fetching group data:", error.message)
                throw new Error(error.message)
            }

            if (data) {
                setGroupName(data[0].group_name || "")
            }

            return data
        },
        {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
        })

    const translateRequest = async (description: string) => {
        try {
            const response = await fetch("/api/text-translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description }),
            });

            if (!response.ok) throw new Error("Translation request failed");

            const data = await response.json();
            setTranslatedEventDescription(data.translatedText);
            setShowTranslatedDescription(true);

            return data.translatedText;
        } catch (error) {
            console.error("Error in translateRequest:", error);
        }
    };

    const addAttendee = useMutation(async () => {
        const { data, error } = await supabase
            .from("event-attendees")
            .upsert({
                user_id: userId,
                event_id: selectedEvent?.id
            })

        if (error) {
            throw error
        }

        const emailResponse = await fetch('/api/attending-event-mail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userEmail,
                userFullName: userName,
                groupName: groupName,
                visitDate: selectedEvent?.starts_at,
                eventTitle: selectedEvent?.event_title,
                eventAddress: selectedEvent?.event_address
            })
        });

        if (!emailResponse.ok) {
            throw new Error('Failed to send emails');
        }
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('attendee')

            toast({
                title: "You have successfully registered for this event",
                description: "You can now attend this event, check your ticket on your dashboard",
            })
        }
    })

    const addTicket = useMutation(async () => {
        const { data, error } = await supabase
            .from("event-tickets")
            .insert({
                event_id: selectedEvent?.id,
                user_id: userId,
                user_fullname: userName,
                user_email: userEmail,
                event_starts_at: selectedEvent?.starts_at,
                event_title: selectedEvent?.event_title,
                event_address: selectedEvent?.event_address,
                ticket_price: selectedEvent?.ticket_price,
            })

        if (error) {
            throw error
        }

        return data
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('ticket')
        }
    })

    const fetchAttendee = useQuery(['attendee'], async () => {
        const { data, error } = await supabase
            .from("event-attendees")
            .select("*")
            .eq("user_id", userId)
            .eq("event_id", selectedEvent?.id || "")

        if (error) {
            throw error
        }

        if (data) {
            setAttendeeData(data as AttendeesData[])
        }

        return data
    },
        {
            enabled: !!userId && !!selectedEvent?.id,
            cacheTime: 10 * 60 * 1000,
        })

    const removeAttendee = useMutation(async () => {
        const { data, error } = await supabase
            .from("event-attendees")
            .delete()
            .eq("user_id", userId)
            .eq("event_id", selectedEvent?.id || "")

        if (error) {
            throw error
        }

        if (data) {
            toast({
                title: "You have successfully unregistered for this event",
                description: "You can no longer attend this event",
            })
        }
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('attendee')
        }
    })

    const removeTicket = useMutation(async () => {
        const { data, error } = await supabase
            .from("event-tickets")
            .delete()
            .eq("user_id", userId)
            .eq("event_id", selectedEvent?.id || "")

        if (error) {
            throw error
        }

        return data
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('ticket')
        }
    })

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
                                    onClick={() => navigator.clipboard.writeText(`https://huddle.net.pl/event-page/${selectedEvent?.id}`)}>
                                    <Files size={16} /> Copy link
                                </Button>
                                <Button className="text-white/70 flex gap-2"
                                    variant="ghost"
                                    onClick={() => {
                                        { pathname.includes("dashboard") ? router.push(`/dashboard/event-page/${selectedEvent?.id}`) : router.push(`/event-page/${selectedEvent?.id}`) }
                                    }}>
                                    <ArrowUpRight size={16} /> Visit event page
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
                                        <p className="text-white/50 text-lg">No picture available</p>
                                    </div>
                                )}
                            <h2 className="text-2xl self-start font-bold text-white/70">{selectedEvent?.event_title}</h2>
                        </div>
                        <div className="flex w-full justify-start gap-8">
                            <div className="flex flex-wrap gap-4">
                                <div className="flex flex-col items-center border-[1px] rounded-xl w-12 h-12">
                                    <div className="text-white/70 uppercase text-xs text-center font-bold bg-white/10 w-full rounded-t-xl">
                                        {format(parseISO(selectedEvent?.starts_at as string), 'MMM')}
                                    </div>
                                    <span className="text-white/50 text-lg font-semibold">
                                        {format(parseISO(selectedEvent?.starts_at as string), 'd')}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-white/70 font-medium">{format(parseISO(selectedEvent?.starts_at as string), 'EEEE, dd MMM')}</p>
                                    <p className="text-white/50 text-sm">{format(parseISO(selectedEvent?.starts_at as string), 'HH:mm')} - {format(parseISO(selectedEvent?.ends_at as string), 'HH:mm')}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex flex-col justify-center items-center border-[1px] rounded-xl w-12 h-12">
                                    <MapPin className="text-white/70" size={24} />
                                </div>
                                <div className="flex flex-col">
                                    {selectedEvent?.event_address && (
                                        <>
                                            <p className="text-white/70 font-medium">
                                                {selectedEvent.event_address.split(', ')[0] || "Unknown City"}
                                            </p>
                                            <p className="text-white/50 text-sm">
                                                {selectedEvent.event_address.split(', ')[1] || "Unknown Street"}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="w-full bg-white/10 rounded-2xl">
                            <div className="w-full bg-white/10 px-4 py-2 rounded-t-2xl">
                                <p className="text-white/70 font-semibold">Attend</p>
                            </div>
                            <div className="flex flex-col gap-2 p-4 text-white/50">
                                Welcome to {selectedEvent?.event_title} event! We look forward to seeing you there. Click the button below to join us.
                                <div className="flex flex-wrap gap-2">
                                    <p className="font-semibold text-white/70 truncate">{userName}</p>
                                    <p className="font-semibold text-white/50 truncate">{userEmail}</p>
                                </div>
                                {attendeeData.length === 0 ? (
                                    <Button className="mt-4" variant="default" onClick={() => {
                                        addAttendee.mutateAsync()
                                        addTicket.mutateAsync()
                                    }}>
                                        Join event
                                    </Button>
                                ) : (
                                    <Button className="mt-4" variant="destructive" onClick={() => {
                                        removeAttendee.mutateAsync()
                                        removeTicket.mutateAsync()
                                    }}>
                                        Leave event
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="w-full flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <p className="text-white/70 font-semibold">About</p>
                                <hr />
                            </div>
                            {!translatedEventDescription && (
                                <Button className="w-fit self-end text-white/70"
                                    variant="ghost"
                                    onClick={() => {
                                        translateRequest(selectedEvent?.event_description as string)
                                    }}>
                                    <Languages size={20} />
                                </Button>
                            ) || (
                                    <Button
                                        className="w-fit flex gap-2 text-white/70"
                                        variant="ghost"
                                        onClick={() => setShowTranslatedDescription(!setShowTranslatedDescription)}
                                    >
                                        <Languages size={20} /> {showTranslatedDescription ? "Show Original" : "Show Translation"}
                                    </Button>
                                )}

                            {showTranslatedDescription === false && (
                                <div dangerouslySetInnerHTML={{ __html: selectedEvent?.event_description as string }}></div>
                            ) || (
                                    <div dangerouslySetInnerHTML={{ __html: translatedEventDescription as string }}></div>
                                )}
                        </div>
                        <div className="w-full flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <p className="text-white/70 font-semibold">Hosted by</p>
                                <hr />
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost"
                                    onClick={() => router.push(`/group-page/${selectedEvent?.event_group}`)}>
                                    <ArrowUpRight size={16} /> <p>{groupName}</p>
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};