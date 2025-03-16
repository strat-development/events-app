"use client"

import { Button } from "@/components/ui/button"
import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { TextEditor } from "../TextEditor"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import { useUserContext } from "@/providers/UserContextProvider"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider"
import Image from "next/image"
import { IconGhost2Filled } from "@tabler/icons-react"
import { usePathname } from "next/navigation"
import { Edit, Save, X } from "lucide-react"
import { EventAttendeesDialog } from "@/components/dashboard/modals/events/EventAttendeesDialog"
import { UserProfileSidebar } from "../../components/UserProfileSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { EventData, UserData } from "@/types/types"

interface EventInfoSectionProps {
    eventId: string
}

export const EventInfoSection = ({ eventId }: EventInfoSectionProps) => {
    const supabase = createClientComponentClient<Database>()
    const [eventDescription, setEventDescription] = useState<string>()
    const [isExpanded, setIsExpanded] = useState(false)
    const [isSetToEdit, setIsSetToEdit] = useState(false)
    const [eventHostId, setEventHostId] = useState<string>()
    const [attendeesId, setAttendeesId] = useState<string[]>([])
    const [profileImageUrls, setProfileImageUrls] = useState<Record<string, string>>({});
    const queryClient = useQueryClient()
    const { userId } = useUserContext()
    const { eventCreatorId } = useGroupOwnerContext()
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [selectedUserImageUrl, setSelectedUserImageUrl] = useState<string | null>(null);
    const [attendeesData, setAttendeesData] = useState<UserData[]>([]);
    const [eventData, setEventData] = useState<EventData | null>(null);

    useQuery(['events-description'], async () => {
        const { data, error } = await supabase
            .from("events")
            .select("*")
            .eq("id", eventId)

        if (error) {
            throw error
        }

        if (data) {
            setEventDescription(data[0].event_description as string)
            setEventHostId(data[0].created_by as string)
            setEventData(data[0])
        }
    },
        {
            cacheTime: 10 * 60 * 1000,
        })

    const eventAttendees = useQuery(
        ['attendees-data'],
        async () => {
            const { data, error } = await supabase
                .from("event-attendees")
                .select(`
                users (
                    *
                )`)
                .eq("event_id", eventId)
                .limit(4)

            if (error) {
                throw new Error(error.message)
            }

            if (data) {
                setAttendeesId(data.map((attendee) => attendee?.users?.id as string))
                setAttendeesData(data.map(attendee => attendee.users) as UserData[])
            }


            return data
        },
        {
            enabled: !!eventId,
            cacheTime: 10 * 60 * 1000,
        })

    const editEventDescriptionMutation = useMutation(
        async (newEventDescription: string) => {
            const { data, error } = await supabase
                .from("events")
                .update({ event_description: newEventDescription })
                .eq("id", eventId)

            if (error) {
                throw error
            }

            if (data) {
                setIsSetToEdit(false)
            }
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('events')
                toast({
                    title: "Success",
                    description: "Description updated successfully",
                });
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to update description",
                    variant: "destructive"
                });
            }
        })

    const { data: profileImages } = useQuery(['profile-pictures', attendeesId], async () => {
        const { data, error } = await supabase
            .from('profile-pictures')
            .select('user_id, image_url')
            .in('user_id', attendeesId);

        if (error) {
            throw error;
        }

        const urlMap: Record<string, string> = {};
        if (data) {
            await Promise.all(
                data.map(async (image) => {
                    const { data: publicURL } = await supabase.storage
                        .from('profile-pictures')
                        .getPublicUrl(image.image_url);
                    if (publicURL && image.user_id) urlMap[image.user_id] = publicURL.publicUrl;
                })
            );
            setProfileImageUrls(urlMap);
        }
        return urlMap;
    }, {
        enabled: attendeesId.length > 0,
        cacheTime: 10 * 60 * 1000,
    });

    const memoizedEventAttendeesData = useMemo(() => attendeesData, [attendeesData])
    const memoizedProfileImages = useMemo(() => profileImageUrls, [profileImageUrls])

    return (
        <>
            <div className="flex flex-col gap-8 max-w-[1200px] w-full justify-self-center">
                <div className="flex flex-col gap-4 px-8">
                    <h2 className='text-xl font-bold tracking-wider'>Little bit about us</h2>
                    <div className='relative'>
                        {isSetToEdit === false && (
                            <>
                                <div
                                    dangerouslySetInnerHTML={{ __html: eventDescription as string }}
                                    className={`overflow-hidden ${isExpanded ? 'max-h-full' : 'max-h-24'} ${!isExpanded && 'blur-effect'}`}></div>
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className='text-blue-500'>
                                    {isExpanded ? 'Show less' : 'Show more'}
                                </button>
                            </>
                        ) || (
                                <div className="flex flex-col gap-4">
                                    <TextEditor
                                        editorContent={eventDescription as string}
                                        onChange={setEventDescription}
                                    />
                                    <div className="flex gap-4">
                                        <Button variant="ghost"
                                            className="w-fit text-blue-500"
                                            onClick={() => {
                                                editEventDescriptionMutation.mutate(eventDescription as string)

                                                setIsSetToEdit(false)
                                            }}>
                                            <Save size={20} />
                                        </Button>
                                        <Button variant="ghost"
                                            className="w-fit text-red-500"
                                            onClick={() => setIsSetToEdit(false)}>
                                            <X size={20} />
                                        </Button>
                                    </div>
                                </div>

                            )}
                    </div>
                    {pathname.includes("dashboard") && eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 && !isSetToEdit &&
                        <div className="flex gap-4">
                            <Button variant="ghost"
                                className="w-fit text-white/70"
                                onClick={() => setIsSetToEdit(true)}>
                                <Edit size={20} />
                            </Button>
                        </div>
                    }
                </div>
                <div className="flex flex-col gap-4">
                    <h2 className='text-2xl font-bold tracking-wider'>Event attendees</h2>
                    <div className="flex gap-4 w-full overflow-x-auto">
                        <div className='flex gap-4'>
                            {memoizedEventAttendeesData?.slice(0, 3).map((attendee) => (
                                <div className="cursor-pointer"
                                    onClick={() => {
                                        setIsSidebarOpen(true)
                                        setIsOpen(true)
                                        setSelectedUser(attendee as UserData)
                                        setSelectedUserImageUrl(attendee ? memoizedProfileImages[attendee.id] : null)
                                    }}
                                    key={attendee?.id}>
                                    <div key={attendee?.id}
                                        className='flex flex-col items-center border border-white/10 p-4 rounded-xl text-center w-[144px] h-full'>
                                        {attendee?.id && memoizedProfileImages[attendee.id] && (
                                            <Image className="rounded-full"
                                                src={memoizedProfileImages[attendee?.id]} width={50} height={50} alt="" />
                                        ) || (
                                                <div className="flex h-[50px] w-[50px] flex-col gap-2 items-center justify-center rounded-full bg-white/5">
                                                    <IconGhost2Filled className="w-6 h-6 text-white/70"
                                                        strokeWidth={1} />
                                                </div>
                                            )}
                                        <span className='font-medium w-full'>{attendee?.full_name}</span>
                                        {attendee?.id === eventHostId && (
                                            <span className='text-sm text-red-500'>Host</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {memoizedEventAttendeesData && memoizedEventAttendeesData.length > 3 && (
                            <EventAttendeesDialog attendeesData={memoizedEventAttendeesData}
                                eventData={eventData}
                                imageUrls={memoizedProfileImages} />
                        )}
                    </div>
                </div>
            </div>

            <SidebarProvider>
                {isSidebarOpen && (
                    <UserProfileSidebar isOpen={isOpen}
                        onClose={() => setIsSidebarOpen(false)}
                        selectedUser={selectedUser}
                        imageUrl={selectedUserImageUrl} />
                )}
            </SidebarProvider>
            <Toaster />
        </>
    )
}