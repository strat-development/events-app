import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Flag } from "lucide-react";
import { useState } from "react";
import { QRCodeGenerator } from "./QrCodeGenerator";
import { Button } from "@/components/ui/button";

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
                <Button variant="outline"
                    className="flex gap-1 items-center h-fit">
                    <Flag strokeWidth={1}
                        size={16} />
                    <p>Share</p>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[360px]">
                <QRCodeGenerator />
            </DialogContent>
        </Dialog>
    );
}