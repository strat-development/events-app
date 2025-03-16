"use client"

import React, { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { Toaster } from "@/components/ui/toaster";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { Edit } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { GroupDescriptionModalStep } from "@/features/create-group-modal/GroupDescriptionModalStep";
import { useGroupDataContext } from "@/providers/GroupDataModalProvider";
import { FileUpload } from "@/components/ui/file-upload";
import { supabaseAdmin } from "@/lib/admin";
import { useUserContext } from "@/providers/UserContextProvider";

interface EditEventDialogProps {
    eventId: string;
}

export const EditEventDialog = ({ eventId }: EditEventDialogProps) => {
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [eventTitle, setEventTitle] = useState("");
    const { editorContent, setEditorContent } = useGroupDataContext();
    const [eventStartDate, setEventStartDate] = useState("");
    const [eventEndDate, setEventEndDate] = useState("");
    const [eventAddress, setEventAddress] = useState("");
    const [eventTicketPrice, setEventTicketPrice] = useState<number | null>(null);
    const [spotsLimit, setSpotsLimit] = useState<number | null>(null);
    const [isFreeTicket, setIsFreeTicket] = useState(false);
    const [isUnlimitedSpots, setIsUnlimitedSpots] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [groupTopics, setGroupTopics] = useState([]);
    const [files, setFiles] = useState<File[]>([]);
    const [eventImageUrl, setEventImageUrl] = useState<string>("");
    const [fetchedGroupsData, setFetchedGroupsData] = useState<any[]>([]);
    const { userId } = useUserContext();
    const [email, setEmail] = useState<string[]>([]);
    const [fullName, setFullName] = useState<string[]>([]);
    const [groupId, setGroupId] = useState<string>("");
    const [groupName, setGroupName] = useState<string>("");

    const groupData = useQuery(
        ["group", groupId],
        async () => {
            const { data, error } = await supabase
                .from("groups")
                .select("group_name")
                .eq('id', groupId);

            if (error) {
                console.error("Error fetching group data:", error.message);
                throw new Error(error.message);
            }

            if (data && data.length > 0) {
                setGroupName(data[0].group_name || "");
            }

            return data;
        },
        {
            enabled: isOpen && !!groupId,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
        }
    );

    const clearStates = useCallback(() => {
        setEventTitle("");
        setEditorContent("");
        setEventStartDate("");
        setEventEndDate("");
        setEventAddress("");
        setEventTicketPrice(0);
        setSpotsLimit(0);
        setSelectedGroup("");
        setFiles([]);
        setEventImageUrl("");
    }, []);

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
                setFetchedGroupsData(data);
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
        };

        fetchGroupTopics();
    }, [selectedGroup]);

    const addEventPicture = useMutation(
        async ({ paths, eventId }: { paths: string[], eventId: string }) => {
            const results = await Promise.all(paths.map(async (path) => {
                const { data: existingRow, error: fetchError } = await supabase
                    .from('event-pictures')
                    .select('event_id')
                    .eq('event_id', eventId)
                    .single();

                if (fetchError && fetchError.code !== 'PGRST116') {
                    throw fetchError;
                }

                if (existingRow) {
                    const { data, error } = await supabase
                        .from('event-pictures')
                        .update({
                            hero_picture_url: path
                        })
                        .eq('event_id', eventId);

                    if (error) {
                        throw error;
                    }
                    return data;
                } else {
                    const { data, error } = await supabase
                        .from('event-pictures')
                        .insert({
                            event_id: eventId,
                            hero_picture_url: path
                        });

                    if (error) {
                        throw error;
                    }
                    return data;
                }
            }));

            return results;
        },
    );

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
                });
            } else {
                toast({
                    title: "Success",
                    description: `File ${files[index].name} uploaded successfully`
                });
            }
        });

        return uploadPromises.map(({ path }) => path);
    };

    const editEvent = useMutation(
        async (eventData: any) => {
            const { data, error } = await supabase
                .from('events')
                .update(eventData)
                .eq('id', eventId)
                .select('id');
            if (error) {
                throw error;
            }

            if (files.length > 0) {
                const paths = await uploadFiles(files);
                await addEventPicture.mutate({ paths, eventId: data[0].id });
            }

            if (!groupName) {
                throw new Error("Group name is not set.");
            }

            const emailResponse = await fetch('/api/edited-event-mail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    userFullName: fullName,
                    groupName: groupName,
                    visitDate: eventStartDate,
                    eventAddress: eventAddress,
                    eventTitle: eventTitle,
                })
            });

            if (!emailResponse.ok) {
                throw new Error('Failed to send emails');
            }

            return data;
        },
        {
            onSuccess: async (data) => {
                if (data) {
                    clearStates();
                    setIsOpen(false);
                    queryClient.invalidateQueries('events');
                    toast({
                        title: "Success",
                        description: "Event updated successfully",
                    });
                }
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to update event",
                });
            }
        }
    );

    const fetchEventData = useQuery(
        ['event', eventId],
        async () => {
            const { data, error } = await supabase
                .from("events")
                .select("*")
                .eq("id", eventId)
                .single();
            if (error) {
                throw error;
            }

            if (data) {
                setEventTitle(data.event_title ?? "");
                setEditorContent(typeof data.event_description === 'string' ? data.event_description : "");
                setEventStartDate(data.starts_at ?? "");
                setEventEndDate(data.ends_at ?? "");
                setEventAddress(data.event_address ?? "");
                setSelectedGroup(data.event_group ?? "");
                setGroupId(data.event_group ?? "");
            }

            return data;
        },
        {
            enabled: isOpen,
            cacheTime: 10 * 60 * 1000,
        }
    );

    const attendeesData = useQuery(
        ["event-attendees", eventId],
        async () => {
            const { data, error } = await supabase
                .from("event-attendees")
                .select(`users (id, full_name, email)`)
                .eq('event_id', eventId);

            if (error) {
                console.error("Error fetching attendees data:", error.message);
                throw new Error(error.message);
            }

            if (data) {
                setEmail(data.map((member) => member.users ? member.users.email as string : ""));
                setFullName(data.map((member) => member.users ? member.users.full_name as string : ""));
            }

            return data;
        },
        {
            enabled: isOpen,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
        }
    );

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <Edit className="text-white/70" size={20} strokeWidth={1} />
                    </Button>
                </DialogTrigger>
                <DialogContent className="flex w-full max-w-[100vw] h-screen rounded-none bg-transparent">
                    <div className="relative flex flex-row max-[900px]:flex-col max-[900px]:items-center items-start max-h-[80vh] overflow-y-auto justify-center w-full gap-16 mt-24">
                        <FileUpload className="max-[900px]:mt-96"
                            onChange={(selectedFiles) => {
                                setFiles(selectedFiles);
                            }}
                        />
                        <div className="flex flex-col gap-4">
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
                                {eventTitle && editorContent && eventAddress && selectedGroup && eventStartDate && eventEndDate && (
                                    <HoverBorderGradient className="w-full"
                                        onClick={() => {
                                            if (!eventTitle || !editorContent || !eventAddress || !eventStartDate || !eventEndDate) {
                                                toast({
                                                    variant: "destructive",
                                                    title: "Invalid Fields",
                                                    description: "Please fill all the required fields.",
                                                });
                                                return;
                                            } else {
                                                editEvent.mutate({
                                                    event_title: eventTitle,
                                                    event_description: editorContent,
                                                    starts_at: eventStartDate,
                                                    ends_at: eventEndDate,
                                                    event_address: eventAddress,
                                                    event_topics: groupTopics,
                                                    ticket_price: isFreeTicket ? 999999999 : eventTicketPrice,
                                                    attendees_limit: isUnlimitedSpots ? 999999999 : spotsLimit,
                                                });
                                            }
                                        }}
                                    >
                                        Update Event
                                    </HoverBorderGradient>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Toaster />
        </>
    );
};