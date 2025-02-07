import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import { useUserContext } from "@/providers/UserContextProvider"
import { Database } from "@/types/supabase"
import { EventData, GroupData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useCallback, useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"
import "../../../../styles/input.css"
import { supabaseAdmin } from "@/lib/admin"
import { FileUpload } from "@/components/ui/file-upload"

interface CreateEventDialogProps {
    ownerId: string
}

export const CreateEventDialog = ({ ownerId }: CreateEventDialogProps) => {
    const supabase = createClientComponentClient<Database>()
    const queryClient = useQueryClient()
    const { userId } = useUserContext()
    const [fetchedGroupsData, setFetchedGroupsData] = useState<GroupData[]>([])

    const [isOpen, setIsOpen] = useState(false)
    const [eventTitle, setEventTitle] = useState("")
    const [eventDescription, setEventDescription] = useState("")
    const [eventDate, setEventDate] = useState("")
    const [eventAddress, setEventAddress] = useState("")
    const [eventTicketPrice, setEventTicketPrice] = useState(0)
    const [selectedGroup, setSelectedGroup] = useState("")
    const [groupTopics, setGroupTopics] = useState([])
    const [spotsLimit, setSpotsLimit] = useState(0)
    const [files, setFiles] = useState<File[]>([]);
    const [eventImageUrl, setEventImageUrl] = useState<string>("")

    const [modalStepCount, setModalStepCount] = useState(1)

    const clearStates = useCallback(() => {
        setEventTitle("")
        setEventDescription("")
        setEventDate("")
        setEventAddress("")
        setEventTicketPrice(0)
        setSpotsLimit(0)
        setSelectedGroup("")
        setFiles([])
        setEventImageUrl("")
    }, [])

    const fetchGroups = useQuery(
        ['groups'],
        async () => {
            const { data, error } = await supabase
                .from("groups")
                .select("group_name, id")
                .eq("group_owner", userId ?? "")
            if (error) {
                throw error
            }

            if (data) {
                setFetchedGroupsData(data as GroupData[])
            }

            return data
        },
        {
            enabled: !!userId,
            cacheTime: 10 * 60 * 1000,
        }
    )

    useEffect(() => {
        const fetchGroupTopics = async () => {
            if (selectedGroup) {
                const { data, error } = await supabase
                    .from("groups")
                    .select("group_topics")
                    .eq("id", selectedGroup)
                if (error) {
                    console.error(error)
                    return
                }

                if (data && data.length > 0) {
                    setGroupTopics(data[0].group_topics as any)
                }
            }
        }

        fetchGroupTopics()
    }, [selectedGroup])

    const addEventPicture = useMutation(async ({ paths, eventId }: { paths: string[], eventId: string }) => {
        const results = await Promise.all(paths.map(async (path) => {
            const { data, error } = await supabase
                .from('event-pictures')
                .upsert({
                    event_id: eventId,
                    hero_picture_url: path
                });
            if (error) {
                throw error;
            }
            return data;
        }));

        return results;
    });

    const uploadFiles = async (files: File[]) => {
        const uploadPromises = files.map((file) => {
            const path = `${file.name}${Math.random()}.${file.name.split('.').pop()}`;
            return { promise: supabaseAdmin.storage.from('event-pictures').upload(path, file), path };
        });

        const responses = await Promise.all(uploadPromises.map(({ promise }) => promise));

        responses.forEach((response, index) => {
            if (response.error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: `Error uploading file ${files[index].name}`
                })
            } else {
                toast({
                    title: "Success",
                    description: `File ${files[index].name} uploaded successfully`
                })
            }
        });

        return uploadPromises.map(({ path }) => path);
    }

    const createEvent = useMutation(
        async (eventData: EventData) => {
            const { data, error } = await supabase
                .from('events')
                .insert(eventData)
                .select('id');
            if (error) {
                throw error;
            }

            return data;
        },
        {
            onSuccess: async (data) => {
                if (data) {
                    const paths = await uploadFiles(files);
                    await addEventPicture.mutate({ paths, eventId: data[0].id });
                    clearStates();
                    setIsOpen(false);
                    queryClient.invalidateQueries('events');
                    toast({
                        title: "Success",
                        description: "Event created successfully",
                    });
                }
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to create event",
                });
            }
        }
    );

    useQuery(
        ['events'],
        async () => {
            const { data, error } = await supabase
                .from("events")
                .select("*")
                .eq("created_by", userId ?? "")
            if (error) {
                throw error
            }

            return data
        },
        {
            enabled: !!userId,
            cacheTime: 10 * 60 * 1000,
        }
    )

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => {
                if (open && ownerId !== userId) {
                    toast({
                        variant: "destructive",
                        title: "Create event",
                        description: "You have to be the owner of the group to create an event"
                    })
                    return
                }

                setIsOpen(open)
            }}>
                <DialogTrigger asChild>
                    <Button className="bg-transparent"
                        onClick={() => fetchGroups.refetch()}
                        variant="outline">
                        Create Event
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create Event</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to create a new event.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4">
                        {modalStepCount === 1 && (
                            <>
                                <Input
                                    placeholder="Event Title"
                                    value={eventTitle}
                                    onChange={(e) => setEventTitle(e.target.value)}
                                />
                                <Select
                                    value={selectedGroup}
                                    onValueChange={(value: string) => setSelectedGroup(value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Event Group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fetchedGroupsData.map((group) => (
                                            <SelectItem key={group.id} value={group.id}>
                                                {group.group_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={() => setModalStepCount(2)}>Next Step</Button>
                            </>
                        )}

                        {modalStepCount === 2 && (
                            <>
                                <Input
                                    placeholder="Event Description"
                                    value={eventDescription}
                                    onChange={(e) => setEventDescription(e.target.value)}
                                />
                                <Input
                                    type="datetime-local"
                                    value={eventDate}
                                    min={new Date().toISOString().slice(0, 16)}
                                    onChange={(e) => setEventDate(e.target.value)}
                                />
                                <Button onClick={() => setModalStepCount(1)}>Previous Step</Button>
                                <Button onClick={() => setModalStepCount(3)}>Next Step</Button>
                            </>
                        )}

                        {modalStepCount === 3 && (
                            <>
                                <Input
                                    placeholder="Event Address"
                                    value={eventAddress}
                                    onChange={(e) => setEventAddress(e.target.value)}
                                />
                                <Input
                                    placeholder="Ticket Price (leave empty for free)"
                                    value={eventTicketPrice}
                                    onChange={(e) => setEventTicketPrice(Number(e.target.value))}
                                />
                                <Input
                                    placeholder="Spots Limit (leave empty for no limit)"
                                    value={spotsLimit}
                                    onChange={(e) => setSpotsLimit(Number(e.target.value))}
                                />
                                <Button onClick={() => setModalStepCount(2)}>Previous Step</Button>
                                <Button onClick={() => setModalStepCount(4)}>Next Step</Button>
                            </>
                        )}

                        {modalStepCount === 4 && (
                            <>
                                <FileUpload
                                    onChange={(selectedFiles) => {
                                        setFiles(selectedFiles);
                                    }}
                                />
                                <Button onClick={() => setModalStepCount(3)}>Previous Step</Button>
                                <HoverBorderGradient
                                    onClick={() => {
                                        if (!eventTitle || !eventDescription || !eventAddress) {
                                            toast({
                                                variant: "destructive",
                                                title: "Invalid Fields",
                                                description: "Please fill all the fields.",
                                            })
                                            return
                                        }

                                        createEvent.mutate({
                                            event_title: eventTitle,
                                            event_description: eventDescription,
                                            starts_at: eventDate,
                                            event_address: eventAddress,
                                            created_by: userId,
                                            event_group: selectedGroup,
                                            event_topics: groupTopics,
                                            ticket_price: eventTicketPrice,
                                            attendees_limit: spotsLimit,
                                        } as unknown as EventData)
                                    }}
                                >
                                    Create Event
                                </HoverBorderGradient>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Toaster />
        </>
    )
}
