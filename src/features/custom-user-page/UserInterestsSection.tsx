import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useMemo, useState } from "react";
import { useQuery } from "react-query";

interface UserInterestsProps {
    userId: string;
}


export const UserInterestsSection = ({ userId }: UserInterestsProps) => {
    const supabase = createClientComponentClient<Database>()
    const [userInterests, setUserInterests] = useState<string[]>([])

    useQuery("userInterests", async () => {
        if (!userId) return
        const { data, error } = await supabase
            .from("users")
            .select("user_interests")
            .eq("id", userId)
        if (error) {
            throw error
        }

        if (data && data.length > 0) {
            setUserInterests(data[0].user_interests as string[])
        }

        return data
    }, {
        enabled: !!userId,
        cacheTime: 10 * 60 * 1000,
    })

    const memoizedUserInterests = useMemo(() => userInterests, [userInterests])

    return (
        <>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                <h2 className="text-2xl font-bold tracking-wider mb-6 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    Interests
                </h2>
                <div className="flex flex-wrap gap-3">
                    {memoizedUserInterests && memoizedUserInterests.length > 0 ? (
                        memoizedUserInterests.map((interest, index) => (
                            <div 
                                key={index}
                                className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg"
                            >
                                <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors tracking-wide">
                                    {interest}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-white/50">No interests added yet</p>
                    )}
                </div>
            </div>
        </>
    )
}