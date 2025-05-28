import { stripe } from "@/lib/stripe-util";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { priceId } = await request.json();

        if (!priceId) {
            return NextResponse.json(
                { error: "Price ID is required" },
                { status: 400 }
            );
        }

        const deactivatedPrice = await stripe.prices.update(
            priceId,
            { active: false },
            { stripeAccount: process.env.STRIPE_ACCOUNT_ID }
        );

        return NextResponse.json({ success: true, deactivatedPrice });

    } catch (error: any) {
        console.error("Stripe price deactivation error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
