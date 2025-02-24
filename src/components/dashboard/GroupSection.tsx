"use client"

import { useEffect } from "react";
import { GroupCard } from "./GroupCard"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";

export const GroupSection = () => {
    const { ownerId } = useGroupOwnerContext()
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
                {ownerId === userId && ownerId.length > 0 && userId.length > 0 && (
                    <GroupCard />
                )}
            </div>
        </>
    )
}