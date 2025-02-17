"use client"

import { InterestsSection } from "@/components/dashboard/InterestsSection";
import { Navbar } from "@/components/dashboard/Navbar";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function InterestsPage() {
    const { userId, loading } = useUserContext();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !userId) {
            router.push('/');
        }
    }, [loading, userId, router]);

    return (
        <>
            <div className="flex justify-between items-start pt-24 max-w-[1200px] w-full justify-self-center">
                <Navbar />
                {userId.length > 0 && (
                    <div className="justify-self-center overflow-x-hidden w-full pl-4 min-[900px]:pl-16">
                        <InterestsSection />
                    </div>
                )}
            </div>
        </>
    )
}