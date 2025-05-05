import { stripe } from "@/lib/stripe-util";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { priceId, successUrl, cancelUrl, metadata } = await request.json();

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID is required" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata
    });

    return NextResponse.json({ 
      sessionId: session.id,
      success: true 
    });

  } catch (error: any) {
    console.error('Stripe session creation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}