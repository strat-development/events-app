"use client"

import { Navbar } from "@/components/dashboard/Navbar";
import { CustomGroupPage } from "@/features/group-page/CustomGroupPage";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function GroupPage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const groupId = params.slug;
    const { userId, loading } = useUserContext();
    const { ownerId } = useGroupOwnerContext();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !userId && !ownerId) {
            router.push('/');
        }
    }, [loading, userId, router]);

    return (
        <div className="max-w-[1200px] w-full flex justify-self-center justify-center items-center min-h-screen">
            <div className="self-start sticky top-24">
                <Navbar />
            </div>

            {ownerId === userId && ownerId.length > 0 && userId.length > 0 && (
                <CustomGroupPage groupId={groupId} />
            )}
        </div>
    );
}