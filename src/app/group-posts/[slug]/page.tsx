"use client"

import { Navbar } from "@/components/dashboard/Navbar";
import { GroupHero } from "@/features/group-page/GroupHero";
import { GroupMembersSidebar } from "@/features/group-page/GroupMembersSidebar";
import { GroupPostsSection } from "@/features/group-page/GroupPostsSection";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import GridLoader from "react-spinners/GridLoader";

export default function GroupPostsPage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const groupId = params.slug;
    const { userId, loading } = useUserContext();
    const router = useRouter();

    useEffect(() => {
        if (!loading && userId === null) {
            router.push('/');
        }
    }, [loading, userId, router]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <GridLoader className="opacity-50" color="#fff" size={24} margin={2} />
            </div>
        )
    }

    return (
        <>
            {userId.length > 0 && (
                <div className="flex justify-self-center justify-between items-start min-h-screen max-w-[1200px] w-full">
                    <Navbar />
                    <div className="flex flex-col mt-24 max-w-[1200px] w-full justify-self-center">
                        <GroupHero groupId={groupId} />
                        <div className="flex flex-wrap justify-between gap-8 relative">
                            <GroupPostsSection groupId={groupId} />
                            <GroupMembersSidebar groupId={groupId} />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}