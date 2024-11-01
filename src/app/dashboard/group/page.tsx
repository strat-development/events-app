"use client"

import { GroupSection } from "@/components/dashboard/GroupSection";
import { Navbar } from "@/components/Navbar";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";

export default function YourGroupsPage() {
    const { userId } = useUserContext();
    const { ownerId } = useGroupOwnerContext()
    const router = useRouter();

    if (!ownerId || !userId) {
        router.push('/');
        return null
    }

    return (
        <>
            {ownerId === userId && ownerId.length > 0 && userId.length > 0 && (
                <div className="flex justify-between items-center h-[100vh]">
                    <Navbar />
                    <GroupSection />
                </div>
            )}
        </>
    );
}