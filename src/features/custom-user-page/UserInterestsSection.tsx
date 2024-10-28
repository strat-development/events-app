import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
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
    })

    return (
        <div className="flex flex-col gap-4 items-center">
            <h1 className="text-4xl font-bold">Interests</h1>
            {userInterests && (
                userInterests.map((interest, index) => (
                    <p key={index}>{interest}</p>
                )))}
        </div>
    )
}