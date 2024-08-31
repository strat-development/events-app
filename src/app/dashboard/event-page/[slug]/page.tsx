import { Navbar } from "@/components/dashboard/Navbar";
import { CustomGroupPage } from "@/features/group-page/CustomGroupPage";


export default function EventPage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const groupId = params.slug;

    return (
        <div className="flex justify-between items-center h-[100vh]">
            <Navbar />
            <CustomGroupPage groupId={groupId} />
        </div>
    );
}