import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Calendar } from "./ui/calendar";
import { CalendarIcon } from "lucide-react";

interface CalendarDialogProps {
    onDayClick: (date: Date) => void;
}

export const CalendarDialog = ({ onDayClick }: CalendarDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Dialog open={isOpen} 
            onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <CalendarIcon strokeWidth={1}
                    className="w-6 h-6 text-black" 
                    onClick={() => setIsOpen(true)} />
                </DialogTrigger>
                <DialogContent className="max-w-[425px] flex flex-col items-center">
                    <DialogHeader>
                        <DialogTitle>Select date</DialogTitle>
                    </DialogHeader>
                    <Calendar onDayClick={onDayClick} />
                </DialogContent>
            </Dialog>
        </>
    )
}