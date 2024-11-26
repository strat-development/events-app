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
            <div className="flex justify-between items-center min-h-screen justify-self-center max-w-[1200px] w-full">
                <CustomGroupPage groupId={groupId} />
            </div>
        </>
    );
}