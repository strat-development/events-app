import { Navbar } from "@/components/dashboard/Navbar";
import { ManagementTable } from "@/features/group-management/ManagementTable";

export default function ManageGroupPage() {
    return (
        <>
            <div className="flex justify-between items-start pt-24 max-w-[1200px] w-full justify-self-center">
                <Navbar />
                <ManagementTable />
            </div>
        </>
    )
}