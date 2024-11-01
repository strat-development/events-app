"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { supabaseAdmin } from "@/lib/admin"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider"
import { useUserContext } from "@/providers/UserContextProvider"
import { EventAttendeesData, EventData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { Database } from "@/types/supabase"

interface EventHeroProps {
    eventId: string
}

export const EventHero = ({ eventId }: EventHeroProps) => {
    const supabase = createClientComponentClient<Database>()
    const queryClient = useQueryClient()
    const { userId } = useUserContext();
    const { eventCreatorId } = useGroupOwnerContext()

    const [eventData, setEventData] = useState<EventData[]>()
    const [eventNameToEdit, setEventNameToEdit] = useState(false)
    const [newEventName, setNewEventName] = useState("")
    const [eventAddressToEdit, setEventAddressToEdit] = useState(false)
    const [newEventAddress, setNewEventAddress] = useState("")
    const [attendeesData, setEventAttendeessData] = useState<EventAttendeesData[]>()
    const [imageUrls, setImageUrls] = useState<{ publicUrl: string }[]>([]);

    useQuery(['events'], async () => {
        const { data, error } = await supabase
            .from("events")
            .select("*")
            .eq("id", eventId)

        if (error) {
            throw error
        }

        if (data) {
            setEventData(data)
        }
    },
        {
            cacheTime: 10 * 60 * 1000,
        })

    useQuery(['event-members'], async () => {
        const { data, error } = await supabase
            .from("event-attendees")
            .select(`
                users (
                    *
                )`)
            .eq("event_id", eventId)

        if (error) {
            throw error
        }

        if (data) {
            setEventAttendeessData(data as unknown as EventAttendeesData[])
        }
    },
        {
            cacheTime: 10 * 60 * 1000,
        })

    const editEventNameMutation = useMutation(async (newEventName: string) => {
        const { data, error } = await supabase
            .from("events")
            .update({ event_title: newEventName })
            .eq("created_by", userId)
            .eq("id", eventId)
        if (error) {
            throw error
        }

        if (data) {
            setEventNameToEdit(false)
        }
    }, {
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Event name changed successfully",
            });

            queryClient.invalidateQueries('events')
        },
        onError: () => {
            toast({
                title: "Error",
                description: "An error occurred while changing the event name",
            });
        }
    })

    const editEventAddressMutation = useMutation(async () => {
        const { data, error } = await supabase
            .from("events")
            .update({ event_address: newEventAddress })
            .eq("created_by", userId)
            .eq("id", eventId)
        if (error) {
            throw error
        }

        if (data) {
            setEventAddressToEdit(false)
        }
    }, {
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Event location changed successfully",
            });

            queryClient.invalidateQueries('events')
        },
        onError: () => {
            toast({
                title: "Error",
                description: "An error occurred while changing the event location",
            });
        }
    })

    const addGroupPicture = useMutation(
        async (paths: string[]) => {
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
        },
    );

    const updateGroupPicture = useMutation(
        async (path: string) => {
            const { data: currentData, error: fetchError } = await supabase
                .from('event-pictures')
                .select('hero_picture_url')
                .eq('event_id', eventId)
                .single();

            if (fetchError) {
                throw fetchError;
            }

            const currentUrl = currentData?.hero_picture_url;

            if (currentUrl) {
                const { error: deleteError } = await supabaseAdmin.storage
                    .from('event-pictures')
                    .remove([currentUrl]);

                if (deleteError) {
                    throw deleteError;
                }
            }

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
        },
        {
            onSuccess: () => {
                toast({
                    title: "Success",
                    description: "Image updated successfully",
                });

                queryClient.invalidateQueries('event-pictures');
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to update image",
                });
            }
        }
    );

    const deleteGroupPicture = useMutation(
        async (path: string) => {
            const { data, error } = await supabase
                .from('event-pictures')
                .delete()
                .eq('hero_picture_url', path);
            if (error) {
                throw error;
            }

            const { error: storageError } = await supabaseAdmin.storage
                .from('event-pictures')
                .remove([path]);

            if (storageError) {
                throw storageError;
            }

            return data;
        },
        {
            onSuccess: () => {
                toast({
                    title: "Success",
                    description: "Image deleted successfully",
                });

                queryClient.invalidateQueries('event-pictures');
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to delete image",
                });
            }
        }
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

    const { data: images, isLoading } = useQuery(
        ['event-pictures', eventId],
        async () => {
            const { data, error } = await supabase
                .from('event-pictures')
                .select('*')
                .eq('event_id', eventId)
            if (error) {
                throw error;
            }
            return data || [];
        },
        {
            enabled: !!eventId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    useEffect(() => {
        if (images) {
            Promise.all(images.map(async (image) => {
                const { data: publicURL } = await supabase.storage
                    .from('event-pictures')
                    .getPublicUrl(image.hero_picture_url || "")

                return { publicUrl: publicURL.publicUrl };

            }))
                .then((publicUrls) => setImageUrls(publicUrls))
                .catch(console.error);
        }
    }, [images]);

    const memoizedEventData = useMemo(() => eventData, [eventData]);
    const memoizedImageUrls = useMemo(() => imageUrls, [imageUrls]);
    const memoizedAttendeesData = useMemo(() => attendeesData, [attendeesData]);

    return (
        <div className="flex flex-col gap-4">
            {memoizedEventData?.map((event) => (
                <div key={event.id} className="bg-white p-4 rounded-md shadow-md">
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-4">
                            <div className="flex flex-col gap-4">
                                {memoizedImageUrls.map((image) => (
                                    <Image key={image.publicUrl}
                                        src={image.publicUrl}
                                        alt=""
                                        width={200}
                                        height={200}
                                    />
                                ))}

                                {window.location.pathname.includes("dashboard") && eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 && (
                                    images?.length ?? 0) > 0 && (
                                        <div className="flex gap-4">
                                            <Button variant={"destructive"}
                                                onClick={() => {
                                                    if (images) {
                                                        if (images[0].hero_picture_url) {
                                                            deleteGroupPicture.mutateAsync(images[0].hero_picture_url);
                                                        }
                                                    }
                                                }}>Delete</Button>
                                        </div>
                                    )}
                            </div>
                        </div>
                
                        <div className="flex gap-4">
                            <h1>{event.event_title}</h1>

                            {window.location.pathname.includes("dashboard") && eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 && !eventNameToEdit && (
                                <Button onClick={() => setEventNameToEdit(true)}>Edit</Button>
                            )}
                        </div>
                        <div>
                            {window.location.pathname.includes("dashboard") && eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 && eventNameToEdit && (
                                <div className="flex gap-4">
                                    <Input placeholder="New event name"
                                        value={newEventName}
                                        onChange={(e) => setNewEventName(e.target.value)}
                                    />
                                    <Button onClick={() => setEventNameToEdit(false)}>Cancel</Button>
                                    <Button onClick={() => {
                                        editEventNameMutation.mutateAsync(newEventName)

                                        setEventNameToEdit(false)
                                    }}>Save</Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                            <p>{event.event_address}</p>
                            {window.location.pathname.includes("dashboard") && eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 && !eventAddressToEdit && (
                                <Button onClick={() => setEventAddressToEdit(true)}>
                                    Edit
                                </Button>
                            )}
                        </div>
                        <div>
                            {window.location.pathname.includes("dashboard") && eventCreatorId === userId && eventCreatorId.length > 0 && userId.length > 0 && eventAddressToEdit && (
                                <div className="flex gap-4">
                                    <Input placeholder="New event address"
                                        value={newEventAddress}
                                        onChange={(e) => setNewEventAddress(e.target.value)}
                                    />
                                    <Button onClick={() => setEventAddressToEdit(false)}>Cancel</Button>
                                    <Button onClick={() => {
                                        editEventAddressMutation.mutateAsync()

                                        setEventAddressToEdit(false)
                                    }}>Save</Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        {memoizedAttendeesData?.map((member) => (
                            <div key={member.id}>
                                <p>Attendees count: {attendeesData?.length || 0}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {window.location.pathname.includes("dashboard") && (
                <div className="flex gap-4">
                    <Link href={`/dashboard/event-page/${eventId}`}>
                        About
                    </Link>
                    <Link href={`/dashboard/event-photos/${eventId}`}>
                        Photos
                    </Link>
                </div>
            ) || (
                    <div className="flex gap-4">
                        <Link href={`/event-page/${eventId}`}>
                            About
                        </Link>
                        <Link href={`/event-photos/${eventId}`}>
                            Photos
                        </Link>
                    </div>
                )}
        </div>
    )
}

