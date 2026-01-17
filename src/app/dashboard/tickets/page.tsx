"use client"

import { Navbar } from "@/components/dashboard/Navbar";
import { TicketsSection } from "@/components/dashboard/TicketsSection";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import GridLoader from "react-spinners/GridLoader";

export default function TicketsPage() {
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
            <div className="flex gap-8 pt-24 max-w-[1200px] w-full justify-self-center px-6">
                <Navbar />
                {userId.length > 0 && (
                    <div className="flex-1 w-full">
                        <TicketsSection />
                    </div>
                )}
            </div>
        </>
    )
}