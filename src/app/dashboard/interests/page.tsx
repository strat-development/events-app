"use client"

import { InterestsSection } from "@/components/dashboard/InterestsSection";
import { Navbar } from "@/components/dashboard/Navbar";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";

export default function InterestsPage() {
    const { userId } = useUserContext();
    const router = useRouter();

    if (!userId) {
        router.push('/');
        return null
    }

    return (
        <>
            {userId.length > 0 && (
                <div className="flex justify-between items-center h-[100vh]">
                    <Navbar />
                    <InterestsSection />
                </div>
            )}
        </>
    )
}