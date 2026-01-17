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
    currency: string;
};

interface RevenueSectionProps {
    connectedAccountId: string;
    isActiveUser: boolean;
}

export const RevenueSection = ({ connectedAccountId }: RevenueSectionProps) => {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [payments, setPayments] = useState<Payments[] | null>(null);
    const [loadingPayments, setLoadingPayments] = useState(false);
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
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-white/90">Revenue Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 cursor-pointer">
                        <p className="text-xs font-medium text-white/60 uppercase tracking-wide mb-2">All Time</p>
                        <p className="text-3xl font-bold text-white/90 mb-1">
                            {analytics?.currency} {analytics?.allTime.revenue.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-sm text-white/60">{analytics?.allTime.ticketsSold || 0} tickets sold</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 cursor-pointer">
                        <p className="text-xs font-medium text-white/60 uppercase tracking-wide mb-2">This Month</p>
                        <p className="text-3xl font-bold text-white/90 mb-1">
                            {analytics?.currency} {analytics?.currentMonth.revenue.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-sm text-white/60">{analytics?.currentMonth.ticketsSold || 0} tickets sold</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 cursor-pointer md:col-span-2">
                        <p className="text-xs font-medium text-white/60 uppercase tracking-wide mb-2">Last Month</p>
                        <p className="text-3xl font-bold text-white/90 mb-1">
                            {analytics?.currency} {analytics?.previousMonth.revenue.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-sm text-white/60">{analytics?.previousMonth.ticketsSold || 0} tickets sold</p>
                    </div>
                </div>
            </div>
        </>
    );
}