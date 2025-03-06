"use client"

import { Navbar } from "@/components/dashboard/Navbar";
import { ManagementSection } from "@/features/group-management/ManagementSection";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import GridLoader from "react-spinners/GridLoader";

export default function ManageGroupPage() {
    const { userId, loading } = useUserContext();
    const { ownerId } = useGroupOwnerContext();
    const router = useRouter();

    useEffect(() => {
        if (!loading && userId === null && ownerId === null) {
            router.push('/');
        }
    }, [loading, userId, router, ownerId]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <GridLoader className="opacity-50" color="#fff" size={24} margin={2} />
            </div>
        )
    }

    return (
        <>
            <div className="flex justify-between items-start pt-24 max-w-[1200px] w-full justify-self-center">
                <Navbar />
                <ManagementSection />
            </div>
        </>
    )
}