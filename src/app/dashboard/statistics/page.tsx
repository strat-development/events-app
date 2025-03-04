import { Navbar } from "@/components/dashboard/Navbar";
import { StatisticsSection } from "@/features/statistics/StatisticsSection";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/router";
import { useEffect } from "react";
import GridLoader from "react-spinners/GridLoader";

export default function StatisticsPage() {
    const { userId, loading } = useUserContext();
    const { eventCreatorId } = useGroupOwnerContext();
    const router = useRouter();

    useEffect(() => {
        if (!loading && userId === null && eventCreatorId === null) {
            router.push('/');
        }
    }, [loading, userId, router, eventCreatorId]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <GridLoader className="opacity-50" color="#fff" size={24} margin={2} />
            </div>
        )
    }

    return (
        <>
            <div className="flex justify-between items-start pt-24 max-w-[1200px] w-full justify-self-center">
                <Navbar />
                <StatisticsSection />
            </div>
        </>
    )
}