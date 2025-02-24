"use client"


import React from "react";
import { useMutation, useQueryClient } from "react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { Toaster } from "@/components/ui/toaster";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface DeleteGroupUserDialogProps {
    userId: string;
}

export const DeleteGroupUserDialog = ({ userId }: DeleteGroupUserDialogProps) => {
    const supabase = createClientComponentClient<Database>()
    const queryClient = useQueryClient()
    const [isOpen, setIsOpen] = React.useState(false);

    const deleteGroupUserMutation = useMutation(
        async (userId: string) => {
            const { error } = await supabase
                .from("group-members")
                .delete()
                .eq('member_id', userId)

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

                queryClient.invalidateQueries("groups")

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
                        <DialogTitle className="text-white/70">Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this user from group? If not please close this dialog.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="destructive"
                            type="submit"
                            onClick={() => {
                                deleteGroupUserMutation.mutate(userId)
                            }}>
                            Delete User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </>
    );
};