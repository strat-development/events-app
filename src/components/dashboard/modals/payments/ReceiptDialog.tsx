import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Edit, ReceiptIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export const ReceiptDialog = () => {
    const { userId } = useUserContext();
    const supabase = createClientComponentClient<Database>();
    const [isOpen, setIsOpen] = useState(false);
    const [description, setDescription] = useState<string>("");
    const [address, setAddress] = useState<string>("");
    const [fullName, setFullName] = useState<string>("");

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button className="flex gap-2 h-fit text-white/70 hover:text-white/80"
                        variant="ghost">
                        <Edit size={16} />
                        Edit receipt
                    </Button>
                </DialogTrigger>
                <DialogContent className="flex flex-col w-full max-w-[400px] h-fit rounded-2xl bg-[#131414]">
                    <div className="flex flex-col items-start gap-4 justify-center">
                        <div className="p-4 text-white/70 bg-white/10 rounded-full w-fit">
                            <ReceiptIcon size={32} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-medium tracking-wide text-white/70">Add refund policy</h2>
                            <p className="text-white/50">Let us know how you want to handle refunds</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Input className="text-white/70 placeholder:text-white/50"
                            placeholder="Full name / Business name"
                            onChange={(e) => setFullName(e.target.value)} />
                        <Input className="text-white/70 placeholder:text-white/50"
                            placeholder="Address"
                            onChange={(e) => setAddress(e.target.value)} />
                        <Textarea className="text-white/70 placeholder:text-white/50"
                            placeholder="Description"
                            onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="flex gap-2 mt-4 w-full">
                        <Button
                            className="w-full bg-blue-500 text-white hover:bg-blue-600"
                            onClick={async () => { }}>
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