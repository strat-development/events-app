import { EventReportDialog } from "@/components/dashboard/modals/contact/EventReportDialog"
import { ShowRefundPolicyDialog } from "@/components/dashboard/modals/payments/ShowRefundPolicyDialog"
import { GroupSidebar } from "@/components/GroupSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Database } from "@/types/supabase"
import { EventData, GroupData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format, parseISO } from "date-fns"
import { Clock, MapPin } from "lucide-react"
import Image from "next/image"
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


    const refundPolicy = useQuery(
        ['refund-policy', eventId, eventData?.[0]?.created_by],
        async () => {
            if (!eventData || !eventData[0]?.created_by) {
                return "";
            }
            const { data, error } = await supabase
                .from("stripe-users")
                .select("refund_policy")
                .eq("user_id", eventData[0].created_by as string)
            if (error) {
                throw new Error(error.message);
            }

            return data?.[0]?.refund_policy || "";
        },
        {
            enabled: !!eventData && !!eventData[0]?.created_by,
        });


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
            Promise.all(images.map(async (image: any) => {
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
            <div className="w-full sticky top-24 flex flex-col gap-6">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                    <div 
                        onClick={() => {
                            setIsSidebarOpen(true);
                            setSelectedGroup(memoizedGroupInfo.data?.[0] || null);
                            setSelectedGroupImageUrl(memoizedGroupImages[0]?.publicUrl || null);
                        }}
                        className='flex cursor-pointer gap-4 items-start w-full p-3 rounded-xl hover:bg-white/5 transition-all duration-300 -m-3 mb-3 group'
                    >
                        {memoizedGroupImages?.map((image) => (
                            <div key={image.publicUrl} className="flex-shrink-0">
                                <Image 
                                    className="w-20 h-20 rounded-xl object-cover ring-2 ring-white/10 group-hover:ring-white/30 transition-all"
                                    src={image.publicUrl}
                                    alt=""
                                    width={200}
                                    height={200}
                                />
                            </div>
                        ))}
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <h3 className="text-lg font-bold tracking-wide text-white/90 group-hover:text-white transition-colors truncate">
                                {memoizedGroupInfo.data?.[0].group_name}
                            </h3>
                            <p className="text-sm text-white/70 truncate">
                                {memoizedGroupInfo.data?.[0].group_country}, {memoizedGroupInfo.data?.[0].group_city}
                            </p>
                        </div>
                    </div>

                    {eventData?.map((event, index) => (
                        <div 
                            key={index}
                            className="flex flex-col gap-4 pt-4 border-t border-white/10"
                        >
                            <div className="flex gap-3 items-start bg-white/5 p-3 rounded-lg">
                                <Clock className="text-white/70 flex-shrink-0 mt-0.5"
                                    size={20}
                                    strokeWidth={1.5} />
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs text-white/50 uppercase tracking-wider">When</p>
                                    <p className="text-base font-medium text-white/90">
                                        {format(parseISO(event.starts_at as string), 'yyyy-MM-dd HH:mm')}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 items-start bg-white/5 p-3 rounded-lg">
                                <MapPin className="text-white/70 flex-shrink-0 mt-0.5"
                                    size={20}
                                    strokeWidth={1.5} />
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs text-white/50 uppercase tracking-wider">Where</p>
                                    <p className="text-base text-white/70">
                                        {event.event_address}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {(eventData && eventData[0] && Number(eventData[0].ticket_price) > 0) && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <ShowRefundPolicyDialog refundPolicy={refundPolicy.data as string} />
                        </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <EventReportDialog eventId={eventId} />
                    </div>
                </div>
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