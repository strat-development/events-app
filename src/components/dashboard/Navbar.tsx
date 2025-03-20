"use client"

import { ChartArea, Heart, LayoutDashboardIcon, PartyPopperIcon, SlidersHorizontal, Ticket, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export const Navbar = () => {
    const pathname = usePathname()

    return (
        <div className="flex flex-col gap-8 items-start w-fit h-full sticky top-24 pr-4">
            <Link className={pathname === "/dashboard" ? "text-primary bg-white/10 rounded-full p-2" : "text-white/50 p-2"} href="/dashboard">
                <LayoutDashboardIcon strokeWidth={1}
                    size={24} />
            </Link>
            <Link className={pathname === "/dashboard/tickets" ? "text-primary bg-white/10 rounded-full p-2" : "text-white/50 p-2"}
                href="/dashboard/tickets">
                <Ticket strokeWidth={1}
                    size={24} />
            </Link>
            <Link className={pathname === "/dashboard/events" ? "text-primary bg-white/10 rounded-full p-2" : "text-white/50 p-2"}
                href="/dashboard/events">
                <PartyPopperIcon strokeWidth={1}
                    size={24} />
            </Link>
            <Link className={pathname === "/dashboard/group" ? "text-primary bg-white/10 rounded-full p-2" : "text-white/50 p-2"}
                href="/dashboard/group">
                <Users strokeWidth={1}
                    size={24} />
            </Link>
            <Link className={pathname === "/dashboard/interests" ? "text-primary bg-white/10 rounded-full p-2" : "text-white/50 p-2"}
                href="/dashboard/interests">
                <Heart strokeWidth={1}
                    size={24} />
            </Link>
            <Link className={pathname === "/dashboard/manage-group" ? "text-primary bg-white/10 rounded-full p-2" : "text-white/50 p-2"}
                href="/dashboard/manage-group">
                <SlidersHorizontal strokeWidth={1}
                    size={24} />
            </Link>
            <Link className={pathname === "/dashboard/statistics" ? "text-primary bg-white/10 rounded-full p-2" : "text-white/50 p-2"}
                href="/dashboard/statistics">
                <ChartArea strokeWidth={1}
                    size={24} />
            </Link>
            {/* <Link href="/dashboard/event-searcher">
                <BotIcon strokeWidth={1}
                    size={24} />
            </Link> */}
        </div>
    )
}