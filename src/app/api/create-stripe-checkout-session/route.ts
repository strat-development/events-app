import { stripe } from "@/lib/stripe-util";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { priceId, successUrl, cancelUrl, metadata, stripeAccountId } = await request.json();
    const platformAccountId = process.env.STRIPE_ACCOUNT_ID;

    if (!priceId || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    let price;
    try {
      price = await stripe.prices.retrieve(priceId, {
        stripeAccount: stripeAccountId
      });
    } catch (err) {
      console.error('Price verification failed:', err);
      return NextResponse.json(
        { error: `Price not found in organizer's account` },
        { status: 400 }
      );
    }

    const sessionParams: any = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: { 
          currency: price.currency,
          product_data: {
            name: 'Event Ticket',
          },
          unit_amount: price.unit_amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        ...metadata,
        connected_account_id: stripeAccountId,
      },
    };

    if (stripeAccountId && stripeAccountId !== platformAccountId) {
      sessionParams.payment_intent_data = {
        transfer_data: {
          destination: stripeAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      payment_intent: session.payment_intent,
      status: session.status
    });

  } catch (error: any) {
    console.error('Stripe API error:', {
      message: error.message,
      code: error.code,
      type: error.type,
      stack: error.stack
    });
    return NextResponse.json(
      { error: `Payment processing error: ${error.message}` },
      { status: 500 }
    );
  }
}