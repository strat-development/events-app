import { stripe } from "@/lib/stripe-util";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = createClientComponentClient<Database>();
    const { userId } = await request.json();

    try {
        if (!userId) {
            return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
        }

        const { data: existingAccounts, error: queryError } = await supabase
            .from('stripe-users')
            .select('*')
            .eq('user_id', userId);

        if (queryError) throw queryError;

        if (existingAccounts && existingAccounts.length > 0) {
            return NextResponse.json({
                accountId: existingAccounts[0].stripe_user_id,
                success: true
            });
        }

        const account = await stripe.accounts.create(
            {
                metadata: {
                    user_id: userId
                }
            }
        );

        const { error: insertError } = await supabase
            .from('stripe-users')
            .insert({
                user_id: userId,
                stripe_user_id: account.id,
                is_active: false,
                created_at: new Date().toISOString()
            });

        if (insertError) throw insertError;

        return NextResponse.json({
            accountId: account.id,
            success: true
        });

    } catch (error: any) {
        console.error('Error creating Stripe account:', error.message);
        return new Response(JSON.stringify({ error: error.message || 'Failed to create Stripe account' }), { status: 500 });
    }
}