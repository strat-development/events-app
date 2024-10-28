"use client"

import { Navbar } from "@/components/dashboard/Navbar"
import { CustomUserPage } from "@/features/custom-user-page/CustomUserPage"
import { useUserContext } from "@/providers/UserContextProvider"

export default function DashboardPage() {
    const { userId } = useUserContext();

    return (
        <div className="flex justify-between items-center h-[100vh]">
            <Navbar />
            <div className="w-full flex items-center">
                <CustomUserPage userIdFromUrl={userId} />
            </div>
        </div>
    )
}