"use client"

import { Navbar } from "@/components/dashboard/Navbar";
import { CustomGroupPage } from "@/features/group-page/CustomGroupPage";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";


export default function GroupPage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const groupId = params.slug;
    const { userId } = useUserContext();
    const { ownerId } = useGroupOwnerContext();
    const router = useRouter();

    if (!ownerId || !userId) {
        router.push('/');
        return null
    }

    return (
        <>
            {ownerId === userId && ownerId.length > 0 && userId.length > 0 && (
                <div className="w-full min-h-screen flex items-center">
                    <Navbar />
                    <div className="flex justify-between items-center h-[100vh]">
                        <CustomGroupPage groupId={groupId} />
                    </div>
                </div>
            )}
        </>
    );
}