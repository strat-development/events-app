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
        <div className="flex justify-between items-center h-[100vh]">
            <Navbar />
            {userId.length > 0 && (
                <div className="w-full flex items-center">
                    <CustomUserPage userIdFromUrl={userId} />
                </div>
            )}
        </div>
    )
}