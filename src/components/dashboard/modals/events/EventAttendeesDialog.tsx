"use client"

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useUserContext } from "@/providers/UserContextProvider";
import { IconGhost2Filled } from "@tabler/icons-react";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import {useState } from "react";
import GridLoader from "react-spinners/GridLoader";
import { MapPin } from "lucide-react";
import { EventData, UserData } from "@/types/types";
import { UserProfileSidebar } from "@/components/UserProfileSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

interface EventAttendeesDialogProps {
    attendeesData: UserData[]
    eventData: EventData | null
    imageUrls: Record<string, string>
}

export const EventAttendeesDialog = ({ attendeesData, eventData, imageUrls }: EventAttendeesDialogProps) => {
    const { loading } = useUserContext();
    const [isOpen, setIsOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [selectedUserImageUrl, setSelectedUserImageUrl] = useState<string | null>(null);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <GridLoader className="opacity-50" color="#fff" size={24} margin={2} />
            </div>
        )
    }

    return (
        <>
            <Dialog open={isOpen}
                onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button className="text-white/70 max-w-[144px] w-full"
                        variant="ghost">More</Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px] flex flex-col items-start max-h-[480px] overflow-y-auto">
                    {eventData && (
                        <>
                            <div className="flex flex-col gap-1">
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2 items-end">
                                        <h2 key={eventData?.id}
                                            className="text-2xl tracking-wider font-bold">{eventData?.event_title}</h2>
                                        <p className="text-white/60">({attendeesData?.length} in total)</p>
                                    </div>
                                    <div className="flex w-full justify-start gap-8">
                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex flex-col items-center border-[1px] rounded-xl w-12 h-12">
                                                <div className="text-white/70 uppercase text-xs text-center font-bold bg-white/10 w-full rounded-t-xl">
                                                    {format(parseISO(eventData?.starts_at as any), 'MMM')}
                                                </div>
                                                <span className="text-white/50 text-lg font-semibold">
                                                    {format(parseISO(eventData?.starts_at as any), 'd')}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="text-white/70 font-medium">{format(parseISO(eventData?.starts_at as any), 'EEEE, dd MMM')}</p>
                                                <p className="text-white/50 text-sm">{format(parseISO(eventData?.starts_at as any), 'HH:mm')} - {format(parseISO(eventData?.ends_at as string), 'HH:mm')}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex flex-col justify-center items-center border-[1px] rounded-xl w-12 h-12">
                                                <MapPin className="text-white/70" size={24} />
                                            </div>
                                            <div className="flex flex-col">
                                                {eventData?.event_address && (
                                                    <>
                                                        <p className="text-white/70 font-medium">
                                                            {eventData?.event_address.split(', ')[0] || "Unknown City"}
                                                        </p>
                                                        <p className="text-white/50 text-sm">
                                                            {eventData?.event_address.split(', ')[1] || "Unknown Street"}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col w-full max-[640px]:justify-center">
                                {attendeesData.map((attendee) => (
                                    <Button key={attendee.id}
                                        variant="ghost"
                                        onClick={() => {
                                            setIsSidebarOpen(true)
                                            setSelectedUser(attendee as UserData)
                                            setSelectedUserImageUrl(imageUrls[attendee.id] || '')
                                        }}
                                        className="flex justify-start p-4 rounded-xl w-full">
                                        <div className="w-12 h-12">
                                            {attendee?.id && (
                                                <div className="flex gap-4 items-center">
                                                    <Image
                                                        src={imageUrls[attendee.id] || ''}
                                                        alt="profile picture"
                                                        width={2000}
                                                        height={2000}
                                                        objectFit="cover"
                                                        className='rounded-full border-[1px] border-white/10'
                                                    />
                                                    <p className="text-white/70 text-lg font-bold">
                                                        {attendee?.full_name}
                                                    </p>
                                                </div>
                                            ) || (
                                                    <div className="flex w-full h-full flex-col gap-2 items-center text-center justify-center">
                                                        <IconGhost2Filled className="text-white/70"
                                                            strokeWidth={1}
                                                            size={24} />
                                                    </div>
                                                )}
                                        </div>
                                    </Button>
                                ))}
                            </div>

                        </>
                    )}
                </DialogContent>
            </Dialog>

            <SidebarProvider>
                {isSidebarOpen && (
                    <UserProfileSidebar isOpen={isOpen}
                        onClose={() => setIsSidebarOpen(false)}
                        selectedUser={selectedUser}
                        imageUrl={selectedUserImageUrl} />
                )}
            </SidebarProvider>
        </>
    )
}