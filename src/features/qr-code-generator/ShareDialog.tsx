import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Share } from "lucide-react";
import { useState, Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";

const QRCodeGenerator = lazy(() => import("./QrCodeGenerator"));

interface ShareDialogProps {
    expanded?: (expanded: boolean) => void;
}

export const ShareDialog = ({ expanded }: ShareDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
                if (expanded) expanded(false);
            }}>
            <DialogTrigger asChild>
                <Button 
                    variant="ghost"
                    className="flex gap-2 items-center h-fit bg-white/5 backdrop-blur-sm hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 px-4 py-2 rounded-xl"
                >
                    <Share size={18} />
                    <span className="text-sm font-medium">Share</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[400px] bg-gray-600/15 backdrop-blur-xl border border-white/10 shadow-2xl">
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center p-12 gap-4">
                        <div className="w-12 h-12 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin"></div>
                        <p className="text-white/60 text-sm">Loading QR Code...</p>
                    </div>
                }>
                    <QRCodeGenerator />
                </Suspense>
            </DialogContent>
        </Dialog>
    );
}