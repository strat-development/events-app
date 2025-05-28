import { stripe } from "@/lib/stripe-util";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { name, description, price, metadata, stripeAccountId } = await request.json();

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    const product = await stripe.products.create({
      name,
      description,
      metadata
    }, {
      stripeAccount: stripeAccountId
    });

    const stripePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(price * 100),
      currency: 'usd',
    }, {
      stripeAccount: stripeAccountId
    });

    return NextResponse.json({
      success: true,
      productId: product.id,
      priceId: stripePrice.id
    });

  } catch (error: any) {
    console.error('Stripe product creation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}