import Link from "next/link"

export const Navbar = () => {
    return (
        <div className="flex flex-col gap-4">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/dashboard/personal-info">Personal Info</Link>
            <Link href="/dashboard/events">Events</Link>
            <Link href="/dashboard/group">Your groups</Link>
            <Link href="/dashboard/interests">Interests</Link>
        </div>
    )
}