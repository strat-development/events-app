"use client"

import { GroupSection } from "@/components/dashboard/GroupSection";
import { Navbar } from "@/components/Navbar";

export default function YourGroupsPage() {


    return (
        <>
            <div className="flex justify-between items-center h-[100vh]">
                <Navbar />
                <GroupSection />
            </div>
        </>
    );
}