"use client"

import { useEffect } from "react";
import { GroupCard } from "./GroupCard"
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";

export const GroupSection = () => {
    const { userId, loading } = useUserContext();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !userId) {
            router.push('/');
        }
    }, [loading, userId, router]);

    return (
        <>
            <div className="flex flex-col gap-4 min-h-[80vh]">
                {userId.length > 0 && (
                    <GroupCard />
                )}
            </div>
        </>
    )
}