import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CreditCardIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ActivateStripeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ActivateStripeDialog = ({ open, onOpenChange }: ActivateStripeDialogProps) => {
    const router = useRouter();

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex flex-col w-full max-w-[400px] h-fit rounded-2xl bg-[#131414]">
                    <div className="flex flex-col items-start gap-4 justify-center">
                        <div className="p-4 text-white/70 bg-white/10 rounded-full w-fit">
                            <CreditCardIcon size={32} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-medium tracking-wide text-white/70">Accept payments</h2>
                            <p className="text-white/50">
                                Your account isn't set up to accept payments <br /> <br />

                                We use <Link href="https://stripe.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#635fff] hover:text-[#7c7fff]">Stripe</Link> to process payments, which requires you to set up your account with Stripe.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => router.push("/dashboard/payments")}>
                        Go to dashboard
                    </Button>
                </DialogContent>
            </Dialog>
        </>
    )
}