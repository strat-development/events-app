import React, { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { Toaster } from "@/components/ui/toaster";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { Edit } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { GroupDescriptionModalStep } from "@/features/create-group-modal/GroupDescriptionModalStep";
import { useGroupDataContext } from "@/providers/GroupDataModalProvider";

interface EditEventDialogProps {
    eventId: string;
}

export const EditEventDialog = ({ eventId }: EditEventDialogProps) => {
    const supabase = createClientComponentClient<Database>()
    const queryClient = useQueryClient()
    const [isOpen, setIsOpen] = useState(false);
    const [eventTitle, setEventTitle] = useState("")
    const { editorContent, setEditorContent } = useGroupDataContext()
    const [eventDate, setEventDate] = useState("")
    const [eventAddress, setEventAddress] = useState("")
    const [eventTicketPrice, setEventTicketPrice] = useState<number | null>(null);
    const [spotsLimit, setSpotsLimit] = useState<number | null>(null);
    const [isFreeTicket, setIsFreeTicket] = useState(false);
    const [isUnlimitedSpots, setIsUnlimitedSpots] = useState(false);
    const [modalStepCount, setModalStepCount] = useState(1)
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

    const clearStates = useCallback(() => {
        setEventTitle("")
        setEditorContent("")
        setEventDate("")
        setEventAddress("")
        setEventTicketPrice(0)
        setSpotsLimit(0)
        setIsFreeTicket(false)
        setIsUnlimitedSpots(false)
        setModalStepCount(1)
        setGroupName("")
    }, [])

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
                setEventTitle(data.event_title ?? "")
                setEditorContent(typeof data.event_description === 'string' ? data.event_description : "")
                setEventDate(data.starts_at ?? "")
                setEventAddress(data.event_address ?? "")
                setEventTicketPrice(data.ticket_price)
                setSpotsLimit(data.attendees_limit)
                setIsFreeTicket(data.ticket_price === 999999999)
                setIsUnlimitedSpots(data.attendees_limit === 999999999)
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

    const editEvent = useMutation(
        async (eventData: any) => {
            const { data, error } = await supabase
                .from('events')
                .update(eventData)
                .eq('id', eventId)
                .select('id');
            if (error) {
                throw error;
            }

            const emailResponse = await fetch('/api/edited-event-mail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    userFullName: fullName,
                    groupName: groupName,
                    visitDate: eventDate,
                    eventAddress: eventAddress,
                    eventTitle: eventTitle,
                })
            });

            if (!emailResponse.ok) {
                throw new Error('Failed to send emails');
            }

            return data;
        },
        {
            onSuccess: async (data) => {
                if (data) {
                    clearStates();
                    setIsOpen(false);
                    queryClient.invalidateQueries('events');
                    toast({
                        title: "Success",
                        description: "Event updated successfully",
                    });
                }
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to update event",
                });
            }
        }
    );


    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <Edit className="text-white/70" size={20} strokeWidth={1} />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Event</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to edit the event.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4">
                        {modalStepCount === 1 && (
                            <>
                                <Input className="placeholder:text-white/60"
                                    placeholder="Event Title"
                                    value={eventTitle}
                                    onChange={(e) => setEventTitle(e.target.value)}
                                />

                                <Button className="w-fit" onClick={() => setModalStepCount(2)}>Next Step</Button>
                            </>
                        )}

                        {modalStepCount === 2 && (
                            <>
                                <Input className="w-fit text-white/70"
                                    type="datetime-local"
                                    value={eventDate}
                                    min={new Date().toISOString().slice(0, 16)}
                                    onChange={(e) => setEventDate(e.target.value)}
                                />
                                <GroupDescriptionModalStep />

                                <div className="flex justify-between gap-4">
                                    <Button className="w-fit" onClick={() => setModalStepCount(1)}>Previous Step</Button>
                                    <Button className="w-fit" onClick={() => setModalStepCount(3)}>Next Step</Button>
                                </div>
                            </>
                        )}

                        {modalStepCount === 3 && (
                            <>
                                <Input
                                    className="placeholder:text-white/60"
                                    placeholder="Event Address (City, Street, Country)"
                                    value={eventAddress}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setEventAddress(value);
                                    }}
                                />
                                <div className="flex gap-4">
                                    <Input
                                        className="placeholder:text-white/60"
                                        placeholder="Ticket Price"
                                        value={eventTicketPrice === null ? "" : eventTicketPrice}
                                        disabled={isFreeTicket}
                                        onChange={(e) => {
                                            let value = e.target.value;
                                            let number = Number(value);

                                            if (isNaN(number) || number < 0) {
                                                toast({
                                                    variant: "destructive",
                                                    title: "Invalid Input",
                                                    description: "Please enter a valid non-negative number.",
                                                });
                                                return;
                                            }

                                            if (number > 9999) {
                                                number = 9999;
                                                toast({
                                                    title: "Limit Reached",
                                                    description: "Maximum ticket price is 9999.",
                                                });
                                            }

                                            setEventTicketPrice(number);
                                        }}
                                    />
                                    <div className="flex w-full items-center gap-2">
                                        <Checkbox
                                            checked={isFreeTicket}
                                            id="free-tickets"
                                            onClick={() => setIsFreeTicket((prev) => !prev)}
                                        />
                                        <label className="text-white/70" htmlFor="free-tickets">
                                            Free Tickets
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Input
                                        className="placeholder:text-white/60"
                                        placeholder="Spots Limit"
                                        value={spotsLimit === null ? "" : spotsLimit}
                                        disabled={isUnlimitedSpots}
                                        onChange={(e) => {
                                            let value = e.target.value;
                                            let number = Number(value);

                                            if (isNaN(number) || number < 0) {
                                                toast({
                                                    variant: "destructive",
                                                    title: "Invalid Input",
                                                    description: "Please enter a valid non-negative number.",
                                                });
                                                return;
                                            }

                                            if (number > 9999) {
                                                number = 9999;
                                                toast({
                                                    title: "Limit Reached",
                                                    description: "Maximum spots limit is 9999.",
                                                });
                                            }

                                            setSpotsLimit(number);
                                        }}
                                    />
                                    <div className="flex w-full items-center gap-2">
                                        <Checkbox
                                            checked={isUnlimitedSpots}
                                            id="no-limit"
                                            onClick={() => setIsUnlimitedSpots((prev) => !prev)}
                                        />
                                        <label className="text-white/70" htmlFor="no-limit">
                                            No Limit
                                        </label>
                                    </div>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <Button className="w-fit" onClick={() => setModalStepCount(2)}>Previous Step</Button>
                                    <HoverBorderGradient
                                        onClick={() => {
                                            if (!eventTitle || !editorContent || !eventAddress || !eventDate) {
                                                toast({
                                                    variant: "destructive",
                                                    title: "Invalid Fields",
                                                    description: "Please fill all the required fields.",
                                                });

                                                return;
                                            }

                                            editEvent.mutate({
                                                event_title: eventTitle,
                                                event_description: editorContent,
                                                starts_at: eventDate,
                                                event_address: eventAddress,
                                                ticket_price: isFreeTicket ? 999999999 : eventTicketPrice,
                                                attendees_limit: isUnlimitedSpots ? 999999999 : spotsLimit,
                                            });
                                        }}
                                    >
                                        Update Event
                                    </HoverBorderGradient>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Toaster />
        </>
    );
};