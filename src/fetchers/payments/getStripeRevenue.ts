
interface Payments {
  id: string;
  amount: number;
  status: string;
  created: number;
  description?: string;
}

interface Analytics {
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
}

export interface StripeRevenueResponse {
  analytics: Analytics | null;
  payments: Payments[] | null;
}

export const getStripeRevenue = async (
  accountId: string
): Promise<StripeRevenueResponse> => {
  const response = await fetch("/api/get-stripe-revenue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountId }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch Stripe revenue data");
  }

  return {
    analytics: data.analytics || null,
    payments: data.payments || null,
  };
};
