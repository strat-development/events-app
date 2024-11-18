"use client"

import { GroupCard } from "./GroupCard"
import { Navbar } from "./Navbar"
import { CreateGroupDialog } from "./modals/CreateGroupDialog"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";

export const GroupSection = () => {
    const { userId } = useUserContext();
    const { ownerId } = useGroupOwnerContext()
    const router = useRouter();

    if (!userId) {
        router.push('/');
        return null
    }

    return (
        <>
            <div className="flex flex-col gap-4 pt-24">
                <CreateGroupDialog />

                {ownerId === userId && ownerId.length > 0 && userId.length > 0 && (
                    <GroupCard />
                )}
            </div>
        </>
    )
}