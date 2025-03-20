import { EventReportDialog } from "@/components/dashboard/modals/contact/EventReportDialog"
import { GroupSidebar } from "@/components/GroupSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Database } from "@/types/supabase"
import { EventData, GroupData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format, parseISO } from "date-fns"
import { Clock, MapPin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useQuery } from "react-query"

interface EventInfoSidebarProps {
    eventId: string
}

export const EventInfoSidebar = ({ eventId }: EventInfoSidebarProps) => {
    const supabase = createClientComponentClient<Database>()
    const [imageUrls, setImageUrls] = useState<{ publicUrl: string }[]>([])
    const [eventData, setEventData] = useState<EventData[]>()
    const groupId = eventData?.map((event) => event.event_group).toString() 
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
    const [selectedGroupImageUrl, setSelectedGroupImageUrl] = useState<string | null>(null);

    useQuery(['event-data'], async () => {
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

    const groupInfo = useQuery(
        ['group-info'],
        async () => {
            const { data, error } = await supabase
                .from("groups")
                .select("*")
                .eq("id", groupId as string)

            if (error) {
                throw new Error(error.message)
            }

            return data
        },
        {
            enabled: !!groupId,
            cacheTime: 10 * 60 * 1000,
        })

    const { data: images, isLoading } = useQuery(
        ['group-picture', groupId],
        async () => {
            const { data, error } = await supabase
                .from('group-pictures')
                .select('*')
                .eq('group_id', groupId as string)
            if (error) {
                throw error;
            }
            return data || [];
        },
        {
            enabled: !!groupId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    useEffect(() => {
        if (images) {
            Promise.all(images.map(async (image) => {
                const { data: publicURL } = await supabase.storage
                    .from('group-pictures')
                    .getPublicUrl(image.hero_picture_url || "")

                return { publicUrl: publicURL.publicUrl };

            }))
                .then((publicUrls) => setImageUrls(publicUrls))
                .catch(console.error);
        }
    }, [images]);

    const memoizedGroupInfo = useMemo(() => groupInfo, [groupInfo])
    const memoizedGroupImages = useMemo(() => imageUrls, [imageUrls])

    return (
        <>
            <div className="w-full sticky top-24 flex flex-col gap-4 border border-white/10 p-4 rounded-xl">
                <div onClick={() => {
                    setIsSidebarOpen(true);
                    setSelectedGroup(memoizedGroupInfo.data?.[0] || null);
                    setSelectedGroupImageUrl(memoizedGroupImages[0]?.publicUrl || null);
                }}
                    className='flex cursor-pointer gap-4 items-start w-full'>
                    {memoizedGroupImages?.map((image) => (
                        <Image className="max-w-[72px] rounded-xl"
                            key={image.publicUrl}
                            src={image.publicUrl}
                            alt=""
                            width={200}
                            height={200}
                        />
                    ))}
                    <div className="flex flex-col">
                        <h3 className="text-xl font-bold tracking-wide">{memoizedGroupInfo.data?.[0].group_name}</h3>
                        <p className="text-white/70">{memoizedGroupInfo.data?.[0].group_country}, {memoizedGroupInfo.data?.[0].group_city}</p>
                    </div>
                </div>

                {eventData?.map((event, index) => (
                    <div key={index}
                        className="flex flex-col gap-2">
                        <div className="flex gap-2 items-center">
                            <Clock className="text-white/70"
                                size={18}
                                strokeWidth={1} />
                            <p className="text-lg font-medium">{format(parseISO(event.starts_at as string), 'yyyy-MM-dd HH:mm')}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <MapPin className="text-white/70"
                                size={18}
                                strokeWidth={1} />
                            <p className="text-white/70">{event.event_address}</p>
                        </div>
                    </div>
                ))}

                <EventReportDialog eventId={eventId} />
            </div>

            <SidebarProvider>
                {isSidebarOpen && <GroupSidebar imageUrl={selectedGroupImageUrl}
                    selectedGroup={selectedGroup}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)} />}
            </SidebarProvider>
        </>
    )
}