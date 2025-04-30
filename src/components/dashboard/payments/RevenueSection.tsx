import { useEffect, useState } from "react";

type Payments = {
    id: string;
    amount: number;
    status: string;
    created: number;
    description?: string;
};

type Analytics = {
    allTime: {
        revenue: number;
        platformFees: number;
        ticketsSold: number;
    };
    currentMonth: {
        revenue: number;
        platformFees: number;
        ticketsSold: number;
    };
    previousMonth: {
        revenue: number;
        platformFees: number;
        ticketsSold: number;
    };
};

interface RevenueSectionProps {
    connectedAccountId: string;
    isActiveUser: boolean;
}

export const RevenueSection = ({ connectedAccountId }: RevenueSectionProps) => {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [payments, setPayments] = useState<Payments[] | null>(null);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [error, setError] = useState(false);
    const [stripeError, setStripeError] = useState<string | null>(null);

    const fetchPayments = async () => {
        if (!connectedAccountId) return;

        setLoadingPayments(true);
        try {
            const response = await fetch("/api/get-stripe-revenue", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accountId: connectedAccountId }),
            });

            const data = await response.json();
            if (response.ok) {
                if (data.analytics) setAnalytics(data.analytics);
                if (data.payments) setPayments(data.payments);
            } else {
                throw new Error(data.error || "Failed to fetch data");
            }
        } catch (err) {
            console.error("Data fetch failed:", err);
            setStripeError((err instanceof Error ? err.message : 'An error occurred while fetching data.'));
        } finally {
            setLoadingPayments(false);
        }
    };

    useEffect(() => {
        if (connectedAccountId) {
            fetchPayments();
        }
    }, [connectedAccountId]);

    return (
        <>
            <div className="col-span-1 flex flex-col gap-4 p-4 bg-[#1a1a1a] rounded-lg shadow-md">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 hover:bg-white/5 rounded-lg transition cursor-pointer">
                        <p className="text-sm text-white/70">All Time</p>
                        <p className="text-2xl font-bold">${analytics?.allTime.revenue.toFixed(2) || 0}</p>
                        <p className="text-sm text-white/70">{analytics?.allTime.ticketsSold || 0} tickets</p>
                    </div>
                    <div className="p-4 hover:bg-white/5 rounded-lg transition cursor-pointer">
                        <p className="text-sm text-white/70">This Month</p>
                        <p className="text-2xl font-bold">${analytics?.currentMonth.revenue.toFixed(2) || 0}</p>
                        <p className="text-sm text-white/70">{analytics?.currentMonth.ticketsSold || 0} tickets</p>
                    </div>
                    <div className="p-4 hover:bg-white/5 rounded-lg transition cursor-pointer">
                        <p className="text-sm text-white/70">Last Month</p>
                        <p className="text-2xl font-bold">${analytics?.previousMonth.revenue.toFixed(2) || 0}</p>
                        <p className="text-sm text-white/70">{analytics?.previousMonth.ticketsSold || 0} tickets</p>
                    </div>

                    {/* <div className="bg-[#252525] p-4 rounded-lg col-span-2">
                                <p className="text-sm text-white/70">Platform Fees</p>
                                <div className="flex justify-between">
                                    <div>
                                        <p className="text-lg font-bold">${analytics?.allTime.platformFees.toFixed(2)}</p>
                                        <p className="text-xs text-white/70">Total</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold">${analytics?.currentMonth.platformFees.toFixed(2)}</p>
                                        <p className="text-xs text-white/70">This Month</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold">${analytics?.previousMonth.platformFees.toFixed(2)}</p>
                                        <p className="text-xs text-white/70">Last Month</p>
                                    </div>
                                </div>
                            </div> */}
                </div>
            </div>
        </>
    );
}