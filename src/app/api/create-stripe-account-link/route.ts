import { stripe } from "@/lib/stripe-util";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { accountId, userId } = await request.json();
        
        if (!accountId || !userId) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${request.headers.get('origin')}/dashboard/payments?refresh=true&userId=${userId}`,
            return_url: `${request.headers.get('origin')}/dashboard/payments?success=true&userId=${userId}`,
            type: 'account_onboarding',
        });

        return NextResponse.json({ 
            url: accountLink.url,
            success: true 
        });

    } catch (error: any) {
        console.error('Stripe account link error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}