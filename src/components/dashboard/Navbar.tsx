"use client"

import { ChartArea, CreditCard, Heart, LayoutDashboardIcon, PartyPopperIcon, SlidersHorizontal, Ticket, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export const Navbar = () => {
    const pathname = usePathname()

    return (
        <div className="flex flex-col gap-3 items-start w-fit h-full sticky top-24">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 shadow-xl flex flex-col gap-2">
                <Link 
                    className={pathname === "/dashboard" 
                        ? "text-white bg-white/20 rounded-xl p-2.5 transition-all duration-300" 
                        : "text-white/50 hover:text-white/80 hover:bg-white/5 rounded-xl p-2.5 transition-all duration-300"
                    } 
                    href="/dashboard"
                >
                    <LayoutDashboardIcon strokeWidth={1.5} size={22} />
                </Link>
                <Link 
                    className={pathname === "/dashboard/tickets" 
                        ? "text-white bg-white/20 rounded-xl p-2.5 transition-all duration-300" 
                        : "text-white/50 hover:text-white/80 hover:bg-white/5 rounded-xl p-2.5 transition-all duration-300"
                    }
                    href="/dashboard/tickets"
                >
                    <Ticket strokeWidth={1.5} size={22} />
                </Link>
                <Link 
                    className={pathname === "/dashboard/payments" 
                        ? "text-white bg-white/20 rounded-xl p-2.5 transition-all duration-300" 
                        : "text-white/50 hover:text-white/80 hover:bg-white/5 rounded-xl p-2.5 transition-all duration-300"
                    }
                    href="/dashboard/payments"
                >
                    <CreditCard strokeWidth={1.5} size={22} />
                </Link>
                <Link 
                    className={pathname === "/dashboard/events" 
                        ? "text-white bg-white/20 rounded-xl p-2.5 transition-all duration-300" 
                        : "text-white/50 hover:text-white/80 hover:bg-white/5 rounded-xl p-2.5 transition-all duration-300"
                    }
                    href="/dashboard/events"
                >
                    <PartyPopperIcon strokeWidth={1.5} size={22} />
                </Link>
                <Link 
                    className={pathname === "/dashboard/group" 
                        ? "text-white bg-white/20 rounded-xl p-2.5 transition-all duration-300" 
                        : "text-white/50 hover:text-white/80 hover:bg-white/5 rounded-xl p-2.5 transition-all duration-300"
                    }
                    href="/dashboard/group"
                >
                    <Users strokeWidth={1.5} size={22} />
                </Link>
                <Link 
                    className={pathname === "/dashboard/interests" 
                        ? "text-white bg-white/20 rounded-xl p-2.5 transition-all duration-300" 
                        : "text-white/50 hover:text-white/80 hover:bg-white/5 rounded-xl p-2.5 transition-all duration-300"
                    }
                    href="/dashboard/interests"
                >
                    <Heart strokeWidth={1.5} size={22} />
                </Link>
                <Link 
                    className={pathname === "/dashboard/manage-group" 
                        ? "text-white bg-white/20 rounded-xl p-2.5 transition-all duration-300" 
                        : "text-white/50 hover:text-white/80 hover:bg-white/5 rounded-xl p-2.5 transition-all duration-300"
                    }
                    href="/dashboard/manage-group"
                >
                    <SlidersHorizontal strokeWidth={1.5} size={22} />
                </Link>
                <Link 
                    className={pathname === "/dashboard/statistics" 
                        ? "text-white bg-white/20 rounded-xl p-2.5 transition-all duration-300" 
                        : "text-white/50 hover:text-white/80 hover:bg-white/5 rounded-xl p-2.5 transition-all duration-300"
                    }
                    href="/dashboard/statistics"
                >
                    <ChartArea strokeWidth={1.5} size={22} />
                </Link>
            </div>
        </div>
    )
}