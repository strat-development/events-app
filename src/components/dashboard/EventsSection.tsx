"use client"

import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/supabase"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { EventData, GroupData } from "@/types/types"
import { Modal } from "@/features/Modal"
import { DatePicker } from "../ui/DatePicker"
import { Toaster } from "../ui/toaster"
import { toast } from "../ui/use-toast";
import { useUserContext } from "@/providers/UserContextProvider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

export const EventsSection = () => {
    const [modalOpen, setModalOpen] = useState(false)
    const [eventTitle, setEventTitle] = useState("")
    const [eventDescription, setEventDescription] = useState("")
    const [eventDate, setEventDate] = useState("")
    const [eventAddress, setEventAddress] = useState("")
    const [eventTicketPrice, setEventTicketPrice] = useState("")
    const [selectedGroup, setSelectedGroup] = useState("")
    const supabase = createClientComponentClient<Database>()
    const queryClient = useQueryClient()
    const { userId } = useUserContext()
    const [fetchedGroupsData, setFetchedGroupsData] = useState<GroupData[]>()

    const clearStates = () => {
        setEventTitle("")
        setEventDescription("")
        setEventDate("")
        setEventAddress("")
        setEventTicketPrice("")
        setSelectedGroup("")
    }

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
        }
    );

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
                    description: "User created successfully",
                });

                clearStates()

                setModalOpen(false)
            },

            onError: () => {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "There was an error creating the event"
                });
            }
        })

    useEffect(() => {
        console.log("Selected group state updated:", selectedGroup);
    }, [selectedGroup]);

    const bodyContent = (
        <div className="flex flex-col gap-4">
            <Input
                placeholder="Event Title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
            />
            <Select
                value={selectedGroup}
                onValueChange={(value: string) => setSelectedGroup(value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Select event group" />
                </SelectTrigger>
                <SelectContent>
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
            <DatePicker
                selectedDate={eventDate}
                onSelect={(date) => setEventDate(date.toISOString())}
            />
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
            <Button onClick={() => {
                createEvent.mutate({
                    event_title: eventTitle,
                    event_description: eventDescription,
                    starts_at: eventDate,
                    event_address: eventAddress,
                    created_by: userId,
                    event_group: selectedGroup,
                    ticket_price: eventTicketPrice
                } as EventData)

                queryClient.invalidateQueries(['events'])
            }}>Create Event</Button>
        </div>
    )

    return (
        <div className="flex flex-col gap-4">
            <Button onClick={() => {
                fetchGroups.refetch()

                setModalOpen(true)
            }}>Create Event</Button>
            <Modal isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Create Event"
                body={bodyContent} />
            <Toaster />
        </div>
    )
}