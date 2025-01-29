"use client"

import { Button } from "@/components/ui/button";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { IconGhost2Filled } from "@tabler/icons-react";
import { format, parseISO } from "date-fns";
import { Calendar, MapPin } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "react-query";

export default function EventAttendeesPage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const eventId = params.slug;
    const supabase = createClientComponentClient<Database>()
    const [attendeesId, setAttendeesId] = useState<string[]>([])
    const [profileImageUrls, setProfileImageUrls] = useState<Record<string, string>>({});
    const router = useRouter();

    const eventData = useQuery(
        ['event-data'],
        async () => {
            const { data, error } = await supabase
                .from("events")
                .select(`
                *
                `)
                .eq("id", eventId)

            if (error) {
                throw new Error(error.message)
            }

            return data
        },
        {
            enabled: !!eventId,
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
                setAttendeesId(data.map((attendee) => attendee.users?.id as string))
            }


            return data
        },
        {
            enabled: !!eventId,
            cacheTime: 10 * 60 * 1000,
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

    const memoizedEventAttendeesData = useMemo(() => eventAttendees, [eventAttendees])
    const memoizedProfileImages = useMemo(() => profileImageUrls, [profileImageUrls])

    return (
        <div className="pt-24 flex flex-col gap-8 max-w-[1200px] w-full justify-self-center">
            <div className="flex flex-col gap-1">
                <p className="text-white/70">Event attendees for </p>
                {eventData.data?.map((event, index) => (
                    <div key={index}
                        className="flex flex-col gap-2">
                        <div className="flex gap-2 items-end">
                            <h2 key={event.id}
                                className="text-2xl tracking-wider font-bold">{event.event_title}</h2>
                            <p className="text-white/60">({memoizedEventAttendeesData.data?.length} in total)</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex gap-2">
                                <Calendar strokeWidth={1}
                                    size={24} />
                                <p className="text-white/60">{format(parseISO(event.starts_at as string), 'yyyy-MM-dd HH:mm')}</p>
                            </div>
                            <div className="flex gap-2">
                                <MapPin strokeWidth={1}
                                    size={24} />
                                <p className="text-white/60">{event.event_address}</p>
                            </div>

                        </div>
                    </div>
                ))}

            </div>
            <div className="flex flex-wrap gap-8 max-[640px]:justify-center">
                {memoizedEventAttendeesData.data?.map((attendee) => (
                    <div key={attendee.users?.id}
                        className="flex flex-col gap-4 border border-white/10 p-4 rounded-md max-w-[196px] w-full">
                        <div className="flex flex-col items-center justify-center gap-4 border rounded-md border-white/10 aspect-square">
                            {attendee.users?.id && memoizedProfileImages && memoizedProfileImages[attendee.users.id] ? (
                                <Image
                                    src={memoizedProfileImages[attendee.users.id]}
                                    alt="profile picture"
                                    width={2000}
                                    height={2000}
                                    objectFit="cover"
                                    className='rounded-md'
                                />
                            ) : (
                                <div className="flex w-full h-full flex-col gap-2 items-center text-center justify-center rounded-md bg-white/5">
                                    <IconGhost2Filled className="w-16 h-16 text-white/70" strokeWidth={1} />
                                    <p className="text-white/50 text-sm">Profile picture not available</p>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <p className="text-xl font-bold tracking-wider line-clamp-1 text-center">{attendee.users?.full_name}</p>
                            <Button onClick={() => router.push(`/user-profile/${attendee.users?.id}`)}>
                                View Profile
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}