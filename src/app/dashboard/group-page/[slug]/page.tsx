import { GroupEditor } from "@/components/dashboard/GroupEditor";
import { Navbar } from "@/components/dashboard/Navbar";


export default function GroupPage() {
    return (
        <div className="flex justify-between items-center h-[100vh]">
            <Navbar />
            <GroupEditor />
        </div>
    );
}