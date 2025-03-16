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
                <Button variant="ghost"
                    className="flex gap-1 items-center h-fit">
                    <Share
                        size={20} />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[360px]">
                <Suspense fallback={<div>Loading QR Code Generator...</div>}>
                    <QRCodeGenerator />
                </Suspense>
            </DialogContent>
        </Dialog>
    );
}