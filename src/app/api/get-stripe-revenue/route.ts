import { stripe } from "@/lib/stripe-util";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { accountId } = await request.json();
    
    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const allCharges = await stripe.charges.list({
      limit: 100,
      expand: ['data.balance_transaction'],
    }, {
      stripeAccount: accountId,
    });

    const currency = allCharges.data[0]?.currency?.toUpperCase() || '';

    const currentMonthCharges = allCharges.data.filter((charge: any) => 
      new Date(charge.created * 1000) >= currentMonthStart
    );
    
    const previousMonthCharges = allCharges.data.filter((charge: any) => {
      const chargeDate = new Date(charge.created * 1000);
      return chargeDate >= previousMonthStart && chargeDate <= previousMonthEnd;
    });

    const calculateMetrics = (charges: any[]) => {
      let revenue = 0;
      let platformFees = 0;
      let ticketsSold = 0;

      charges.forEach(charge => {
        if (charge.paid && charge.status === 'succeeded') {
          revenue += charge.amount - (charge.balance_transaction?.fee || 0);
          platformFees += charge.balance_transaction?.fee || 0;
          ticketsSold += charge.metadata?.ticket_count ? parseInt(charge.metadata.ticket_count) : 0;
        }
      });

      return {
        revenue: revenue / 100,
        platformFees: platformFees / 100,
        ticketsSold
      };
    };

    const allTime = calculateMetrics(allCharges.data);
    const currentMonth = calculateMetrics(currentMonthCharges);
    const previousMonth = calculateMetrics(previousMonthCharges);

    return NextResponse.json({
      analytics: {
        allTime,
        currentMonth,
        previousMonth,
        currency
      },
      payments: allCharges.data
    });
  } catch (err: any) {
    console.error("Error fetching analytics:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}