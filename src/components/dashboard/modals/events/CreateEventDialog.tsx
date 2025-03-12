import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
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
import { GroupDescriptionModalStep } from "@/features/create-group-modal/GroupDescriptionModalStep"
import { useGroupDataContext } from "@/providers/GroupDataModalProvider"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X } from "lucide-react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

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
    const { editorContent, setEditorContent } = useGroupDataContext()
    const [eventStartDate, setEventStartDate] = useState("")
    const [eventEndDate, setEventEndDate] = useState("")
    const [eventAddress, setEventAddress] = useState("")
    const [eventTicketPrice, setEventTicketPrice] = useState<number | null>(null);
    const [spotsLimit, setSpotsLimit] = useState<number | null>(null);
    const [isFreeTicket, setIsFreeTicket] = useState(false);
    const [isUnlimitedSpots, setIsUnlimitedSpots] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState("")
    const [groupTopics, setGroupTopics] = useState([])
    const [files, setFiles] = useState<File[]>([]);
    const [eventImageUrl, setEventImageUrl] = useState<string>("")

    const clearStates = useCallback(() => {
        setEventTitle("")
        setEditorContent("")
        setEventStartDate("")
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
                    <Button
                        className="flex flex-col items-center justify-center w-[280px] h-[440px] rounded-xl bg-transparent hover:bg-white/5 transition-all duration-300"
                        onClick={() => fetchGroups.refetch()}
                        variant="ghost">
                        <div className="flex flex-col items-center">
                            <div className="text-6xl text-white/70">
                                <Plus size={128} />
                            </div>
                            <p className="text-xl tracking-wide text-white/50 font-medium">Create new event</p>
                        </div>
                    </Button>
                </DialogTrigger>
                <DialogContent className="flex w-full max-w-[100vw] h-screen rounded-none bg-transparent">
                    <div className="relative flex flex-row max-[900px]:flex-col max-[900px]:items-center items-start max-h-[80vh] overflow-y-auto justify-center w-full gap-16 mt-24">
                        <DialogPrimitive.Close className="absolute right-96 rounded-xl opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                            <X className="h-4 w-4 text-white/70" />
                            <span className="sr-only">Close</span>
                        </DialogPrimitive.Close>
                        <FileUpload className="max-[900px]:mt-96"
                            onChange={(selectedFiles) => {
                                setFiles(selectedFiles);
                            }}
                        />
                        <div className="flex flex-col gap-4">
                            <Select
                                value={selectedGroup}
                                onValueChange={(value: string) => setSelectedGroup(value)}>
                                <SelectTrigger>
                                    <SelectValue className="placeholder:text-white/60"
                                        placeholder="Select Event Group" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fetchedGroupsData.map((group) => (
                                        <SelectItem key={group.id} value={group.id}>
                                            {group.group_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input className="placeholder:text-white/60 bg-transparent border-none text-2xl outline-none"
                                placeholder="Event Title"
                                value={eventTitle}
                                onChange={(e) => setEventTitle(e.target.value)}
                            />

                            <div className="flex flex-col gap-2 w-full items-end justify-center">
                                <div className="flex items-center w-full justify-between bg-white/5 p-2 rounded-xl">
                                    <span className="text-white/50">Start Date</span>
                                    <Input className="w-fit text-white/70 bg-white/5"
                                        type="datetime-local"
                                        value={eventStartDate}
                                        min={new Date().toISOString().slice(0, 16)}
                                        onChange={(e) => setEventStartDate(e.target.value)}
                                    />
                                </div>


                                <div className="flex items-center w-full justify-between bg-white/5 p-2 rounded-xl">
                                    <span className="text-white/50">End Date</span>
                                    <Input className="w-fit text-white/70 bg-white/5"
                                        type="datetime-local"
                                        value={eventEndDate}
                                        min={eventStartDate}
                                        onChange={(e) => setEventEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <GroupDescriptionModalStep />

                            <Input
                                className="placeholder:text-white/60"
                                placeholder="Event Address (City, Street, Country)"
                                value={eventAddress}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setEventAddress(value);
                                }}
                            />
                            <div className="flex gap-4">
                                <Input
                                    className="placeholder:text-white/60"
                                    placeholder="Ticket Price"
                                    value={eventTicketPrice === null ? "" : eventTicketPrice}
                                    disabled={isFreeTicket}
                                    onChange={(e) => {
                                        let value = e.target.value;
                                        let number = Number(value);

                                        if (isNaN(number) || number < 0) {
                                            toast({
                                                variant: "destructive",
                                                title: "Invalid Input",
                                                description: "Please enter a valid non-negative number.",
                                            });
                                            return;
                                        }

                                        if (number > 9999) {
                                            number = 9999;
                                            toast({
                                                title: "Limit Reached",
                                                description: "Maximum ticket price is 9999.",
                                            });
                                        }

                                        setEventTicketPrice(number);
                                    }}
                                />
                                <div className="flex w-full items-center gap-2">
                                    <Checkbox
                                        checked={isFreeTicket}
                                        id="free-tickets"
                                        onClick={() => setIsFreeTicket((prev) => !prev)}
                                    />
                                    <label className="text-white/70" htmlFor="free-tickets">
                                        Free Tickets
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Input
                                    className="placeholder:text-white/60"
                                    placeholder="Spots Limit"
                                    value={spotsLimit === null ? "" : spotsLimit}
                                    disabled={isUnlimitedSpots}
                                    onChange={(e) => {
                                        let value = e.target.value;
                                        let number = Number(value);

                                        if (isNaN(number) || number < 0) {
                                            toast({
                                                variant: "destructive",
                                                title: "Invalid Input",
                                                description: "Please enter a valid non-negative number.",
                                            });
                                            return;
                                        }

                                        if (number > 9999) {
                                            number = 9999;
                                            toast({
                                                title: "Limit Reached",
                                                description: "Maximum spots limit is 9999.",
                                            });
                                        }

                                        setSpotsLimit(number);
                                    }}
                                />
                                <div className="flex w-full items-center gap-2">
                                    <Checkbox
                                        checked={isUnlimitedSpots}
                                        id="no-limit"
                                        onClick={() => setIsUnlimitedSpots((prev) => !prev)}
                                    />
                                    <label className="text-white/70" htmlFor="no-limit">
                                        No Limit
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-between gap-4">
                                {eventTitle && editorContent && eventAddress && selectedGroup && eventStartDate && eventEndDate && files.length > 0 && (
                                    <HoverBorderGradient className="w-full"
                                        onClick={() => {
                                            if (!eventTitle || !editorContent || !eventAddress || !selectedGroup || !eventStartDate || eventEndDate || !files) {
                                                toast({
                                                    variant: "destructive",
                                                    title: "Invalid Fields",
                                                    description: "Please fill all the required fields.",
                                                });
                                                return;
                                            } else {
                                                createEvent.mutate({
                                                    event_title: eventTitle,
                                                    event_description: editorContent,
                                                    starts_at: eventStartDate,
                                                    ends_at: eventEndDate,
                                                    event_address: eventAddress,
                                                    created_by: userId,
                                                    event_group: selectedGroup,
                                                    event_topics: groupTopics,
                                                    ticket_price: isFreeTicket ? 999999999 : eventTicketPrice,
                                                    attendees_limit: isUnlimitedSpots ? 999999999 : spotsLimit,
                                                } as unknown as EventData);
                                            }
                                        }}
                                    >
                                        Create Event
                                    </HoverBorderGradient>
                                )}
                            </div>
                        </div>

                    </div>
                </DialogContent>
            </Dialog>

            <Toaster />
        </>
    )
}
