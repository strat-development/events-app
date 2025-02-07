import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { useUserContext } from "@/providers/UserContextProvider"
import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Heart } from "lucide-react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "react-query"
import GridLoader from "react-spinners/GridLoader"

export const SavedEventsSection = () => {
    const supabase = createClientComponentClient<Database>()
    const { userId } = useUserContext()
    const queryClient = useQueryClient()

    const savedEvents = useQuery(['saved-events'], async () => {
        const { data, error } = await supabase
            .from("saved-events")
            .select("*")
            .eq("user_id", userId)

        if (error) {
            throw error
        }

        return data
    }, {
        enabled: !!userId
    })

    const deleteEventMutation = useMutation(async (eventId: string) => {
        const { data, error } = await supabase
            .from("saved-events")
            .delete()
            .eq("id", eventId)

        if (error) {
            throw error
        }
    }, {
        onSuccess: () => {
            toast({
                title: "Event deleted",
                description: "This event has been removed from your saved events",
            })

            queryClient.invalidateQueries('saved-events')
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "There was an error deleting this event",
            })
        }
    })

    return (
        <>
            {savedEvents.isLoading && <div className="h-screen w-full flex items-center justify-center">
                <GridLoader className="opacity-50" color="#fff" size={24} margin={2} />
            </div>}
            {savedEvents.data && savedEvents.data.length === 0 && <p>No saved events</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1200px] w-full justify-self-center">
                {savedEvents.data && savedEvents.data.map((event: any) => (
                    <Card key={event.id} className="shadow-md rounded-lg p-4 relative">
                        <h3 className="text-lg font-bold text-white/70 truncate max-w-[90%]">{event.event_name}</h3>
                        <p className="text-sm text-white/50">{event.event_city}</p>
                        <p className="text-sm text-white/50">{event.event_place}</p>
                        <p className="text-sm text-white/50">{event.event_date}</p>
                        <p className="text-sm text-white/50">{event.event_time}</p>
                        <Link href={event.event_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Find Tickets</Link>
                        <Heart className="absolute text-red-500 top-4 right-4 cursor-pointer" onClick={() => deleteEventMutation.mutate(event.id)} />
                    </Card>
                ))}
            </div>


        </>
    )
}