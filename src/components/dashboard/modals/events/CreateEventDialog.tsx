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

export const CreateEventDialog = () => {
    const supabase = createClientComponentClient<Database>()
    const queryClient = useQueryClient()
    const { userId } = useUserContext()
    const [fetchedGroupsData, setFetchedGroupsData] = useState<GroupData[]>([])

    const [isOpen, setIsOpen] = useState(false);
    const [eventTitle, setEventTitle] = useState("")
    const [eventDescription, setEventDescription] = useState("")
    const [eventDate, setEventDate] = useState("")
    const [eventAddress, setEventAddress] = useState("")
    const [eventTicketPrice, setEventTicketPrice] = useState("")
    const [selectedGroup, setSelectedGroup] = useState("")
    const [groupTopics, setGroupTopics] = useState([]);
    const [spotsLimit, setSpotsLimit] = useState(0)

    const clearStates = useCallback(() => {
        setEventTitle("")
        setEventDescription("")
        setEventDate("")
        setEventAddress("")
        setEventTicketPrice("")
        setSelectedGroup("")
    }, [])

    const fetchGroups = useQuery(
        ['groups'],
        async () => {
            const { data, error } = await supabase
                .from("groups")
                .select("group_name, id")
                .eq("group_owner", userId ?? "");
            if (error) {
                throw error;
            }

            if (data) {
                setFetchedGroupsData(data as GroupData[]);
            }

            return data;
        },
        {
            enabled: !!userId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    useEffect(() => {
        const fetchGroupTopics = async () => {
            if (selectedGroup) {
                const { data, error } = await supabase
                    .from("groups")
                    .select("group_topics")
                    .eq("id", selectedGroup);
                if (error) {
                    console.error(error);
                    return;
                }

                if (data && data.length > 0) {
                    setGroupTopics(data[0].group_topics as any);
                }
            }
        }

        fetchGroupTopics();
    }, [selectedGroup]);

    const createEvent = useMutation(
        async (eventData: EventData) => {
            const { data, error } = await supabase
                .from("events")
                .upsert(eventData)
            if (error) {
                throw error
            }

            return data
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['events'])
                toast({
                    title: "Success",
                    description: "Event created successfully",
                });

                clearStates()
                setIsOpen(false)
            },

            onError: () => {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "There was an error creating the event"
                });
            }
        })


    useQuery(
        ['events'],
        async () => {
            const { data, error } = await supabase
                .from("events")
                .select("*")
                .eq("created_by", userId ?? "");
            if (error) {
                throw error;
            }

            return data;
        },
        {
            enabled: !!userId,
            cacheTime: 10 * 60 * 1000,
        }
    )

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-transparent"
                        onClick={() => {
                            fetchGroups.refetch()
                        }}
                        variant="outline">Create event</Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit event</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to edit this event? If not please close this dialog.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4">
                        <Input
                            placeholder="Event Title"
                            value={eventTitle}
                            onChange={(e) => setEventTitle(e.target.value)}
                        />
                        <Select
                            value={selectedGroup}
                            onValueChange={(value: string) => {
                                setSelectedGroup(value)
                            }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select event group" />
                            </SelectTrigger>
                            <SelectContent className="block bg-red w-full">
                                {fetchedGroupsData?.map((group) => (
                                    <SelectItem
                                        value={group.id}
                                        key={group.id}
                                    >
                                        {group.group_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Input
                            placeholder="Event Description"
                            value={eventDescription}
                            onChange={(e) => setEventDescription(e.target.value)}
                        />
                        <Input
                            type="datetime-local"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)} />
                        <Input
                            placeholder="Event Address"
                            value={eventAddress}
                            onChange={(e) => setEventAddress(e.target.value)}
                        />
                        <Input
                            placeholder="Ticket Price"
                            value={eventTicketPrice}
                            onChange={(e) => setEventTicketPrice(e.target.value)}
                        />
                        <Input
                            placeholder="Spots Limit"
                            value={spotsLimit}
                            onChange={(e) => setSpotsLimit(Number(e.target.value))}
                        />
                    </div>

                    <DialogFooter>
                        <HoverBorderGradient onClick={() => {
                            createEvent.mutate({
                                event_title: eventTitle,
                                event_description: eventDescription,
                                starts_at: eventDate,
                                event_address: eventAddress,
                                created_by: userId,
                                event_group: selectedGroup,
                                event_topics: groupTopics,
                                ticket_price: eventTicketPrice,
                                attendees_limit: spotsLimit
                            } as unknown as EventData)

                            queryClient.invalidateQueries(['events'])
                        }}>Create Event</HoverBorderGradient>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </>
    )
}