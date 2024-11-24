"use client"

import { Navbar } from "@/components/dashboard/Navbar";
import { CustomGroupPage } from "@/features/group-page/CustomGroupPage";
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
    const router = useRouter();

    // if (!userId) {
    //     router.push('/');
    //     return null
    // }

    return (
        <>
            <div className="w-full min-h-screen flex">
                <div className="flex justify-between items-center h-[100vh]">
                    <CustomGroupPage groupId={groupId} />
                </div>
            </div>
        </>
    );
}