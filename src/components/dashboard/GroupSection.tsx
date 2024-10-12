"use client"

import { GroupCard } from "./GroupCard"
import { Navbar } from "./Navbar"
import { CreateGroupDialog } from "./modals/CreateGroupDialog"

export const GroupSection = () => {
  
    return (
        <>
            <div className="flex gap-16">
                <Navbar />
                <div className="flex flex-col gap-4">
                    <CreateGroupDialog />
                    <GroupCard />
                </div>
            </div>
        </>
    )
}