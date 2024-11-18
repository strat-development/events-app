"use client"

import { Navbar } from "@/components/dashboard/Navbar"
import { CustomUserPage } from "@/features/custom-user-page/CustomUserPage"
import { useUserContext } from "@/providers/UserContextProvider"
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const { userId } = useUserContext();
    const router = useRouter();

    if (!userId) {
        router.push('/');
        return null
    }

    return (
        <div className="flex justify-between items-start pt-24 max-w-[1200px] w-full justify-self-center">
            <Navbar />
            {userId.length > 0 && (
                <div className="justify-self-center overflow-x-hidden w-full">
                    <CustomUserPage userIdFromUrl={userId} />
                </div>
            )}
        </div>
    )
}