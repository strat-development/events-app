"use client"

import { Navbar } from "@/components/dashboard/Navbar";
import { Ticketsection } from "@/components/dashboard/TicketsSection";
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
            <div className="flex justify-between items-start pt-24 max-w-[1200px] w-full justify-self-center">
                <Navbar />
                {userId.length > 0 && (
                    <div className="justify-self-center overflow-x-hidden w-full">
                        <Ticketsection />
                    </div>
                )}
            </div>
        </>
    )
}