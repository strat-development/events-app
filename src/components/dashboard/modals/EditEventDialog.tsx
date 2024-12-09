"use client"


import React, { useState } from "react";
import { useMutation } from "react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { Toaster } from "@/components/ui/toaster";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { DatePicker } from "@/components/ui/DatePicker";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";

interface EditEventDialogProps {
    eventId: string;
}

export const EditEventDialog = ({ eventId }: EditEventDialogProps) => {
    const supabase = createClientComponentClient<Database>()
    const [isOpen, setIsOpen] = useState(false);
    const [eventTitle, setEventTitle] = useState("")
    const [eventDescription, setEventDescription] = useState("")
    const [eventDate, setEventDate] = useState("")
    const [eventAddress, setEventAddress] = useState("")
    const [eventTicketPrice, setEventTicketPrice] = useState("")

    const editEventMutation = useMutation(
        async (eventId: string) => {
            const { error } = await supabase
                .from("events")
                .update({
                    event_title: eventTitle,
                    event_description: eventDescription,
                    starts_at: eventDate,
                    event_address: eventAddress,
                    ticket_price: eventTicketPrice,
                })
                .eq('id', eventId)

            if (error) {
                console.error("Error editing event:", error.message)
                throw new Error(error.message)
            }
        },
        {
            onSuccess: () => {
                toast({
                    variant: "default",
                    title: "Success",
                    description: "Event edited successfully",
                })

                setIsOpen(false)
            },
            onError: (error) => {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "There was an error editing the event"
                })
            },
        }
    )



    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">Edit</Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit event</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to edit this event? If not please close this dialog.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4">
                        <Input
                            placeholder="Event Title"
                            value={eventTitle}
                            onChange={(e) => setEventTitle(e.target.value)}
                        />
                        <Input
                            placeholder="Event Description"
                            value={eventDescription}
                            onChange={(e) => setEventDescription(e.target.value)}
                        />
                        <Input type="date"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)} />
                        <Input
                            placeholder="Event Address"
                            value={eventAddress}
                            onChange={(e) => setEventAddress(e.target.value)}
                        />
                        <Input
                            placeholder="Ticket Price"
                            value={eventTicketPrice}
                            onChange={(e) => setEventTicketPrice(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <HoverBorderGradient
                            onClick={() => {
                                editEventMutation.mutateAsync(eventId)
                            }}>
                            Edit event
                        </HoverBorderGradient>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </>
    );
};