"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { useGroupDataContext } from "@/providers/GroupDataModalProvider"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus } from "lucide-react"
import { TextEditor } from "@/features/TextEditor"
import { GenerateDescriptionDialog } from "./GenerateDescriptionDialog"
import { ActivateStripeDialog } from "../payments/ActivateStripeDialog"
import { useStripeProducts } from "@/hooks/useStripeProducts"

interface CreateEventDialogProps {
    ownerId: string
}

export const CreateEventDialog = ({ ownerId }: CreateEventDialogProps) => {
    const supabase = createClientComponentClient<Database>()
    const queryClient = useQueryClient()
    const { userId, stripeUser } = useUserContext()
    const [fetchedGroupsData, setFetchedGroupsData] = useState<GroupData[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [eventTitle, setEventTitle] = useState("")
    const { editorContent, setEditorContent } = useGroupDataContext()
    const [eventStartDate, setEventStartDate] = useState("")
    const [eventEndDate, setEventEndDate] = useState("")
    const [eventAddress, setEventAddress] = useState("")
    const [eventTicketPrice, setEventTicketPrice] = useState<string | null>(null);
    const [spotsLimit, setSpotsLimit] = useState<string | null>(null);
    const [isFreeTicket, setIsFreeTicket] = useState(false);
    const [isUnlimitedSpots, setIsUnlimitedSpots] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState("")
    const [groupTopics, setGroupTopics] = useState([])
    const [files, setFiles] = useState<File[]>([]);
    const [showStripeDialog, setShowStripeDialog] = useState(false);
    const { createProduct } = useStripeProducts();

    const clearStates = useCallback(() => {
        setEventTitle("")
        setEditorContent("")
        setEventStartDate("")
        setEventAddress("")
        setEventTicketPrice("")
        setSpotsLimit("")
        setSelectedGroup("")
        setFiles([])
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

    const createStripeProduct = async (eventId: string) => {
        if (!eventTicketPrice || isFreeTicket || !stripeUser?.isActive) return null;

        try {
            const result = await createProduct.mutateAsync({
                eventId,
                name: eventTitle,
                description: editorContent,
                price: parseFloat(eventTicketPrice),
                metadata: {
                    event_id: eventId,
                    created_by: userId || '',
                    group_id: selectedGroup
                },
                stripeAccountId: stripeUser.stripeUserId
            });

            if (!result) {
                throw new Error('Failed to create Stripe product');
            }

            const { error: updateError } = await supabase
                .from('stripe-products')
                .update({
                    stripe_product_id: result.stripe_product_id,
                    stripe_price_id: result.stripe_price_id
                })
                .eq('id', eventId);

            if (updateError) throw updateError;

            return result;
        } catch (error: any) {
            console.error("Failed to create Stripe product:", error);
            toast({
                variant: "destructive",
                title: "Stripe Error",
                description: error.message || "Failed to create product in Stripe"
            });
            throw error;
        }
    };

    const createEvent = useMutation(
        async (eventData: EventData) => {
            const { data: event, error } = await supabase
                .from('events')
                .insert(eventData)
                .select('id')
                .single();

            if (error) throw error;

            if (!isFreeTicket && eventTicketPrice && stripeUser?.isActive) {
                await createStripeProduct(event.id);
            }

            return event;
        },
        {
            onSuccess: async (data) => {
                if (data) {
                    try {
                        const paths = await uploadFiles(files);
                        await addEventPicture.mutateAsync({ paths, eventId: data.id });
                        clearStates();
                        setIsOpen(false);
                        queryClient.invalidateQueries('events');
                        toast({
                            title: "Success",
                            description: "Event created successfully",
                        });
                    } catch (error) {
                        console.error("Error in post-event creation:", error);
                        toast({
                            variant: "destructive",
                            title: "Error",
                            description: "Event created but there were issues with additional processing",
                        });
                    }
                }
            },
            onError: (error: any) => {
                console.error("Event creation error:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error.message || "Failed to create event",
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

    const handleFreeTicketChange = (checked: boolean) => {
        if (!checked && (!stripeUser || stripeUser?.isActive === false)) {
            setShowStripeDialog(true);
            return;
        }
        setIsFreeTicket(checked);
    };

    useEffect(() => {
        if (!stripeUser || !stripeUser.isActive) {
            setIsFreeTicket(true);
        }
    }, [stripeUser]);

    return (
        <>
            <ActivateStripeDialog
                open={showStripeDialog}
                onOpenChange={setShowStripeDialog}
            />
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
                    <div className="relative flex flex-row max-[900px]:flex-col max-[900px]:items-center items-start overflow-y-auto justify-center w-full gap-16 mt-8">
                        <div className="flex flex-col gap-8 items-center">
                            <FileUpload className="max-[900px]:mt-96"
                                onChange={(selectedFiles) => {
                                    setFiles(selectedFiles);
                                }}
                            />
                        </div>

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

                            <div className="flex flex-col gap-4 items-end max-w-[400px]">
                                <TextEditor {
                                    ...{
                                        editorContent: editorContent,
                                        onChange: setEditorContent
                                    }
                                } />
                                <GenerateDescriptionDialog />
                            </div>

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
                                        const value = e.target.value;

                                        if (value === "") {
                                            setEventTicketPrice("");
                                            return;
                                        }

                                        if (value.toUpperCase() === "FREE") {
                                            setEventTicketPrice("FREE");
                                            return;
                                        }

                                        if (/^\d*\.?\d*$/.test(value)) {
                                            setEventTicketPrice(value);
                                        }
                                    }}
                                />
                                <div className="flex w-full items-center gap-2">
                                    <Checkbox
                                        checked={isFreeTicket}
                                        id="free-tickets"
                                        onCheckedChange={handleFreeTicketChange}
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
                                        const value = e.target.value;

                                        if (value === "") {
                                            setSpotsLimit("");
                                            return;
                                        }

                                        if (value.toUpperCase() === "NO LIMIT") {
                                            setSpotsLimit("NO LIMIT");
                                            return;
                                        }

                                        if (/^\d+$/.test(value)) {
                                            setSpotsLimit(value);
                                        }
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

                            {eventTitle && editorContent && eventAddress && selectedGroup && eventStartDate && eventEndDate && files.length > 0 && (
                                <HoverBorderGradient className="w-full"
                                    onClick={() => {
                                        if (!eventTitle || !editorContent || !eventAddress || !selectedGroup || !eventStartDate || !eventEndDate || !files) {
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
                                                ticket_price: isFreeTicket ? "FREE" : eventTicketPrice,
                                                attendees_limit: isUnlimitedSpots ? "NO_LIMIT" : spotsLimit,
                                            } as unknown as EventData);
                                        }
                                    }}
                                >
                                    Create Event
                                </HoverBorderGradient>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}