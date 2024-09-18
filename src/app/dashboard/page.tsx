"use client"

import { Navbar } from "@/components/dashboard/Navbar"
import { UserProfileSection } from "@/components/dashboard/UserProfileSection"

export default function DashboardPage() {
    return (
        <div className="flex justify-between items-center h-[100vh]">
            <Navbar />
            <UserProfileSection />
        </div>
    )
}