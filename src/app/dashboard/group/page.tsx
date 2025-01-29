"use client"

import { GroupSection } from "@/components/dashboard/GroupSection";
import { Navbar } from "@/components/dashboard/Navbar";
import { useUserContext } from "@/providers/UserContextProvider";

export default function YourGroupsPage() {
    const { userId } = useUserContext();

    return (
        <>
            <div className="flex justify-between items-start mt-24 max-w-[1200px] w-full justify-self-center">
                <Navbar />
                {userId.length > 0 && (
                    <div className="justify-self-center overflow-x-hidden w-full pl-4 min-[900px]:pl-16">
                        <GroupSection />
                    </div>
                )}
            </div>
        </>
    );
}