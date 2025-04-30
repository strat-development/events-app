import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Unlink } from "lucide-react";
import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { useMutation } from "react-query";
import { toast } from "@/components/ui/use-toast";

export const UnlinkAccountDialog = () => {
    const supabase = createClientComponentClient<Database>();
    const [isOpen, setIsOpen] = useState(false);
    const { userId } = useUserContext();

    const unlinkAccountMutation = useMutation(
        async () => {
            const { data, error } = await supabase
                .from("stripe-users")
                .delete()
                .eq("user_id", userId);

            if (error) {
                throw new Error(error.message);
            }

            return data;
        }, {
        onSuccess: () => {
            setIsOpen(false)
            toast({
                title: "Success",
                description: "Stripe account unlinked successfully",
            })
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to unlink Stripe account",
            })
        }
    })

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <button className="text-red-500 hover:text-red-500/80"
                        onClick={() => setIsOpen(true)}>
                        disconnect current one
                    </button>
                </DialogTrigger>
                <DialogContent className="flex flex-col w-full max-w-[400px] h-fit rounded-2xl bg-[#131414]">
                    <div className="flex flex-col items-start gap-4 justify-center">
                        <div className="p-4 text-red-500/70 bg-red-500/10 rounded-full w-fit">
                            <Unlink size={32} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold text-white/70">Unlink Stripe</h1>
                            <p className="text-white/50">Are you sure you want to unlink your Stripe account?</p>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4 w-full">
                        <Button
                            className="w-full"
                            variant="destructive"
                            onClick={async () => {
                                await unlinkAccountMutation.mutate();
                            }}>
                            Unlink
                        </Button>
                        <DialogPrimitive.Close asChild>
                            <Button className="w-full" variant="ghost">Cancel</Button>
                        </DialogPrimitive.Close>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}