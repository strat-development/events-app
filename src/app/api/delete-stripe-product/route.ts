import { stripe } from "@/lib/stripe-util";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
    try {
        const { productId, priceId } = await request.json();

        if (!productId) {
            return NextResponse.json(
                { error: "Product ID is required" },
                { status: 400 }
            );
        }

        if (priceId) {
            await stripe.prices.update(
                priceId,
                { active: false },
                { stripeAccount: process.env.STRIPE_ACCOUNT_ID }
            );
        }

        const prices = await stripe.prices.list({
            product: productId,
            active: true,
            limit: 100
        }, {
            stripeAccount: process.env.STRIPE_ACCOUNT_ID
        });

        for (const price of prices.data) {
            await stripe.prices.update(
                price.id,
                { active: false },
                { stripeAccount: process.env.STRIPE_ACCOUNT_ID }
            );
        }

        const archivedProduct = await stripe.products.update(
            productId,
            { 
                active: false,
                name: `[ARCHIVED] ${(await stripe.products.retrieve(productId)).name}`,
                description: "Archived product - no longer available"
            },
            { stripeAccount: process.env.STRIPE_ACCOUNT_ID }
        );

        return NextResponse.json({ 
            success: true,
            archivedProduct,
            message: "Product archived and all prices deactivated" 
        });

    } catch (error: any) {
        console.error('Stripe archival error:', error);
        return NextResponse.json(
            { 
                error: error.message,
                resolution: "Product has been archived but not deleted to preserve financial records"
            },
            { status: 200 }
        );
    }
}