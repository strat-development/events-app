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
            <div className="flex justify-between items-start pt-24 max-w-[1200px] w-full justify-self-center">
                <Navbar />
                {userId.length > 0 && (
                    <div className="justify-self-center overflow-x-hidden w-full px-8">
                        <InterestsSection />
                    </div>
                )}
            </div>
        </>
    )
}