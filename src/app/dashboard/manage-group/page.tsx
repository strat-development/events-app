import { Navbar } from "@/components/dashboard/Navbar";
import { GroupManagementTable } from "@/features/group-management/GroupManagementTable";
import { ManagementSection } from "@/features/group-management/ManagementSection";

export default function ManageGroupPage() {
    return (
        <>
            <div className="flex justify-between items-start pt-24 max-w-[1200px] w-full justify-self-center">
                <Navbar />
                <ManagementSection />
            </div>
        </>
    )
}