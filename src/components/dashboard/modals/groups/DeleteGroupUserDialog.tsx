"use client"

import { useMutation, useQueryClient } from "react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Trash } from "lucide-react";
import { useState } from "react";

interface DeleteGroupUserDialogProps {
    userId: string;
}

export const DeleteGroupUserDialog = ({ userId }: DeleteGroupUserDialogProps) => {
    const supabase = createClientComponentClient<Database>()
    const queryClient = useQueryClient()
    const [isOpen, setIsOpen] = useState(false);

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
                    <Button variant="ghost"
                        className="w-fit flex items-center mt-2 gap-2 cursor-pointer text-white/50"
                        onClick={() => setIsOpen(true)}>
                        Delete User
                        <Trash className="text-red-500" size={20} />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-white/70">Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this user from group? If not please close this dialog.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button className="text-red-500"
                            variant="ghost"
                            type="submit"
                            onClick={() => {
                                deleteGroupUserMutation.mutate(userId)
                            }}>
                            <Trash size={20} />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            
        </>
    );
};