"use client"


import React, { useState } from "react";
import { useMutation } from "react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { Toaster } from "@/components/ui/toaster";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface DeleteEventDialogProps {
    eventId: string;
}

export const DeleteEventDialog = ({ eventId }: DeleteEventDialogProps) => {
    const supabase = createClientComponentClient<Database>()
    const [isOpen, setIsOpen] = useState(false);

    const deleteEventMutation = useMutation(
        async (eventId: string) => {
            const { error } = await supabase
                .from("events")
                .delete()
                .eq('id', eventId)

            if (error) {
                console.error("Error deleting event:", error.message)
                throw new Error(error.message)
            }
        },
        {
            onSuccess: () => {
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
                <Button variant="destructive">Delete</Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete event</DialogTitle>
                        <DialogDescription className="text-white/70">
                            Are you sure you want to delete this event? If not please close this dialog.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="destructive"
                            type="submit"
                            onClick={() => {
                                deleteEventMutation.mutate(eventId)
                            }}>
                            Delete event
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </>
    );
};