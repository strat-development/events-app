import { BotIcon, Heart, LayoutDashboardIcon, PartyPopperIcon, Users } from "lucide-react"
import Link from "next/link"

export const Navbar = () => {
    return (
        <div className="flex flex-col gap-8 items-start w-fit h-full sticky top-24 pr-4">
            <Link href="/dashboard">
                <LayoutDashboardIcon strokeWidth={1}
                    size={24} />
            </Link>
            <Link href="/dashboard/events">
                <PartyPopperIcon strokeWidth={1}
                    size={24} />
            </Link>
            <Link href="/dashboard/group">
                <Users strokeWidth={1}
                    size={24} />
            </Link>
            <Link href="/dashboard/interests">
                <Heart strokeWidth={1}
                    size={24} />
            </Link>
            {/* <Link href="/dashboard/event-searcher">
                <BotIcon strokeWidth={1}
                    size={24} />
            </Link> */}
        </div>
    )
}