"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTrigger
} from "@/components/ui/dialog"
import { Banknote } from "lucide-react"

interface RefundPolicyProps {
    refundPolicy: string
}

export const ShowRefundPolicyDialog = ({ refundPolicy }: RefundPolicyProps) => {
    return (
        <>
            <Dialog>
                <DialogTrigger asChild>
                    <button className="text-blue-500 hover:text-blue-400 ml-1">
                        View refund policy
                    </button>
                </DialogTrigger>
                <DialogContent className="max-w-[90%] sm:max-w-md rounded-lg bg-[#131414] border border-white/10">
                    <div className="flex flex-col items-start gap-4 justify-center">
                        <div className="p-4 text-white/70 bg-white/10 rounded-full w-fit">
                            <Banknote size={32} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-medium tracking-wide text-white/70">Refund policy</h2>
                        </div>
                    </div>
                    <div
                        className="text-white/70 text-sm whitespace-pre-line"
                        dangerouslySetInnerHTML={{ __html: refundPolicy }}
                    />
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="ghost">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}