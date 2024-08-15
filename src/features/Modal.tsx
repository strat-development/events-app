"use client"

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useCallback, useEffect, useState } from "react";

interface ModalProps {
    isOpen?: boolean;
    onClose: () => void;
    title?: string;
    body?: React.ReactElement;
    disabled?: boolean;
    children?: React.ReactNode;
    onChange?: (open: boolean) => void;
}

export const Modal = ({
    isOpen,
    onClose,
    title,
    body,
    disabled,
    children,
    onChange,
}: ModalProps) => {

    const [showModal, setShowModal] = useState(isOpen);

    useEffect(() => {
        setShowModal(isOpen);
    }, [isOpen]);

    const handleClose = useCallback(() => {
        if (disabled) {
            return;
        }

        setShowModal(false);
        setTimeout(() => {
            onClose();
        }, 300)
    }, [onClose, disabled]);

    if (!isOpen) {
        return null;
    }

    return (
        <>
            <Dialog open={isOpen}
                onOpenChange={onChange}>
                <DialogContent>
                    <h2>{title}</h2>
                    {body}
                    {children}
                </DialogContent>
            </Dialog>
        </>
    )
}