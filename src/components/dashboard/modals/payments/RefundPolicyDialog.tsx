import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useUserContext } from "@/providers/UserContextProvider";
import { Banknote, Plus } from "lucide-react";
import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { TextEditor } from "@/features/TextEditor";
import { useMutation } from "react-query";
import { toast } from "@/components/ui/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

export const RefundPolicyDialog = () => {
    const supabase = createClientComponentClient<Database>();
    const [isOpen, setIsOpen] = useState(false);
    const { userId } = useUserContext();
    const [editorContent, setEditorContent] = useState<string>("");

    const policyMutation = useMutation(
        async (editorContent: string) => {
            const { data, error } = await supabase
                .from("stripe-users")
                .update({ refund_policy: editorContent })
                .eq("user_id", userId);

            if (error) {
                throw new Error(error.message);
            }

            return data;
        }, {
        onSuccess: () => {
            setIsOpen(false),
                toast({
                    title: "Success",
                    description: "Refund policy updated successfully",
                })
        },
        onError: () => {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Error updating refund policy",
            })
        }
    })


    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button className="text-white/70 hover:text-white/80"
                        variant="ghost">
                        <Plus size={16} />
                        Add policy
                    </Button>
                </DialogTrigger>
                <DialogContent className="flex flex-col w-full max-w-[400px] h-fit rounded-2xl bg-[#131414]">
                    <div className="flex flex-col items-start gap-4 justify-center">
                        <div className="p-4 text-white/70 bg-white/10 rounded-full w-fit">
                            <Banknote size={32} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-medium tracking-wide text-white/70">Add refund policy</h2>
                            <p className="text-white/50">Let us know how you want to handle refunds</p>
                        </div>
                    </div>
                    <TextEditor {
                        ...{
                            editorContent: editorContent,
                            onChange: setEditorContent
                        }
                    } />
                    <div className="flex gap-2 mt-4 w-full">
                        <Button
                            className="w-full bg-blue-500 text-white hover:bg-blue-600"
                            disabled={!editorContent}
                            onClick={async () => {
                                policyMutation.mutateAsync(editorContent);
                            }}>
                            Save
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
