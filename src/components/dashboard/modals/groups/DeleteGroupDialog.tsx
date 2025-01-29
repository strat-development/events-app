"use client"


import React from "react";
import { useMutation } from "react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { Toaster } from "@/components/ui/toaster";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface DeleteGroupDialogProps {
    groupId: string;
}

export const DeleteGroupDialog = ({ groupId }: DeleteGroupDialogProps) => {
    const supabase = createClientComponentClient<Database>()
    const [isOpen, setIsOpen] = React.useState(false);

    const deleteGroupMutation = useMutation(
        async (groupId: string) => {
            const { error } = await supabase
                .from("groups")
                .delete()
                .eq('id', groupId)

            if (error) {
                console.error("Error deleting Group:", error.message)
                throw new Error(error.message)
            }
        },
        {
            onSuccess: () => {
                toast({
                    variant: "default",
                    title: "Success",
                    description: "Group deleted successfully",
                })

                setIsOpen(false)
            },
            onError: (error) => {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "There was an error deleting the Group"
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
                        <DialogTitle className="text-white/70">Delete Group</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this Group? If not please close this dialog.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="destructive"
                            type="submit"
                            onClick={() => {
                                deleteGroupMutation.mutate(groupId)
                            }}>
                            Delete Group
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </>
    );
};