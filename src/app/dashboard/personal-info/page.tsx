import { Navbar } from "@/components/dashboard/Navbar"
import { PersonalInfoSection } from "@/components/dashboard/PersonalnfoSection";

export default function PersonalInfoPage() {
    return (
        <div className="flex justify-between items-center h-[100vh]">
            <Navbar />
            <PersonalInfoSection />
        </div>
    );
}