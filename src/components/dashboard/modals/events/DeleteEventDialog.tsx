"use client"


import React, { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { Toaster } from "@/components/ui/toaster";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Trash } from "lucide-react";

interface DeleteEventDialogProps {
    eventId: string;
}

export const DeleteEventDialog = ({ eventId }: DeleteEventDialogProps) => {
    const supabase = createClientComponentClient<Database>()
    const queryClient = useQueryClient()
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState<string[]>([])
    const [fullName, setFullName] = useState<string[]>([])
    const [groupId, setGroupId] = useState<string>("")
    const [groupName, setGroupName] = useState<string>("")

    const groupData = useQuery(
        ["group", groupId],
        async () => {
            const { data, error } = await supabase
                .from("groups")
                .select("group_name")
                .eq('id', groupId)

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
            enabled: isOpen,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
        })

    const attendeesData = useQuery(
        ["event-attendees", eventId],
        async () => {
            const { data, error } = await supabase
                .from("event-attendees")
                .select(`users (id, full_name, email)`)
                .eq('event_id', eventId)

            if (error) {
                console.error("Error fetching attendees data:", error.message)
                throw new Error(error.message)
            }

            if (data) {
                setEmail(data.map((member) => member.users ? member.users.email as string : ""))
                setFullName(data.map((member) => member.users ? member.users.full_name as string : ""))
            }

            return data
        },
        {
            enabled: isOpen,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
        })

    const fetchEventData = useQuery(
        ['event', eventId],
        async () => {
            const { data, error } = await supabase
                .from("events")
                .select("*")
                .eq("id", eventId)
                .single()
            if (error) {
                throw error
            }

            if (data) {
                setGroupId(data.event_group ?? "")
            }

            return data
        },
        {
            enabled: isOpen,
            cacheTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
        }
    )


    const deleteEventMutation = useMutation(
        async (eventId: string) => {
            const { error } = await supabase
                .from("events")
                .delete()
                .eq('id', eventId)

            const emailResponse = await fetch('/api/deleted-event-mail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    userFullName: fullName,
                    groupName: groupName
                })
            });

            if (!emailResponse.ok) {
                throw new Error('Failed to send emails');
            }

            if (error) {
                console.error("Error deleting event:", error.message)
                throw new Error(error.message)
            }
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries("events")
                toast({
                    variant: "default",
                    title: "Success",
                    description: "Event deleted successfully",
                })

                setIsOpen(false)
            },
            onError: (error) => {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "There was an error deleting the event"
                })
            },
        }
    )


    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="destructive">
                        <Trash size={20} />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-white/70 text-base">Delete event</DialogTitle>
                        <DialogDescription className="text-white/50">
                            Are you sure you want to delete this event? If not please close this dialog.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button className="text-red-500" 
                        variant="ghost"
                            type="submit"
                            onClick={() => {
                                deleteEventMutation.mutate(eventId)
                            }}>
                            <Trash size={20} />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </>
    );
};