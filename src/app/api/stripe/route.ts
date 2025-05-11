import { stripe } from "@/lib/stripe-util";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(request: Request) {
    const body = await request.text();
    const signature = headers().get('stripe-signature') as string;
    const supabase = createClientComponentClient<Database>();

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        return NextResponse.json(
            { error: `Webhook Error: ${err.message}` },
            { status: 400 }
        );
    }

    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;

            await supabase
                .from('stripe-sessions')
                .update({
                    status: 'paid',
                    payment_intent_id: session.payment_intent as string,
                    amount_total: session.amount_total || null,
                    currency: session.currency || null,
                    updated_at: new Date().toISOString()
                })
                .eq('stripe_session_id', session.id);

            break;
            
        case 'checkout.session.expired':
            await supabase
                .from('stripe-sessions')
                .update({
                    status: 'expired',
                    updated_at: new Date().toISOString()
                })
                .eq('stripe_session_id', event.data.object.id);

            break;
    }

    return NextResponse.json({ received: true });
}