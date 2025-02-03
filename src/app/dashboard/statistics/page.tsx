import { Navbar } from "@/components/dashboard/Navbar";
import { StatisticsSection } from "@/features/statistics/StatisticsSection";

export default function StatisticsPage() {
    return (
        <>
            <div className="flex justify-between items-start pt-24 max-w-[1200px] w-full justify-self-center">
                <Navbar />
                <StatisticsSection />
            </div>
        </>
    )
}