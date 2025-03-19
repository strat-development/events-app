import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "react-query";

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
        <div className="flex flex-col gap-4 items-start w-fit">
            <h1 className="text-xl font-semibold tracking-wider">Interests</h1>
            <div className="flex flex-wrap gap-4">
                {memoizedUserInterests && (
                    memoizedUserInterests.map((interest, index) => (
                        <div key={index}
                            className="border border-white/10 bg-gradient-to-br text-white/70 hover:text-white/80 text-sm py-1 px-2 transition duration-300 rounded-xl cursor-pointer hover:shadow-lg hover:shadow-white/5 max-w-[148px] w-fit">
                            <p className="tracking-wide font-medium truncate"
                                key={index}>{interest}</p>
                        </div>
                    )))}
            </div>
        </div>
    )
}