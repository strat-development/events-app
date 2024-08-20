import { InterestsSection } from "@/components/dashboard/InterestsSection";
import { Navbar } from "@/components/dashboard/Navbar";

export default function InterestsPage() {
    return (
        <div className="flex justify-between items-center h-[100vh]">
            <Navbar />
            <div>
                <InterestsSection />
            </div>
        </div>
    )
}