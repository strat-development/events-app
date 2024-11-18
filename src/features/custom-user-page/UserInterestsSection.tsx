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
            <h1 className="text-2xl font-bold">Interests</h1>
            <div className="grid grid-cols-2 gap-4 min-[900px]:grid-cols-3">
                {memoizedUserInterests && (
                    memoizedUserInterests.map((interest, index) => (
                        <div className="border border-white/10 bg-gradient-to-br from-white/10 to-transparent transition duration-300 p-2 rounded-md text-lg cursor-pointer w-f">
                            <p key={index}>{interest}</p>
                        </div>
                    )))}
            </div>
        </div>
    )
}