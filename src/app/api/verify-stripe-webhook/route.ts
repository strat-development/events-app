import { stripe } from "@/lib/stripe-util";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { headers, cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const body = await request.text();
  const signature = headers().get("Stripe-Signature")!;

  let event: Stripe.Event;

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
    case "account.updated":
      const account = event.data.object as Stripe.Account;
      const stripeUserId = account.id;

      const { data: existingAccount } = await supabase
        .from("stripe-users")
        .select("* ")
        .eq("stripe_user_id", stripeUserId)
        .maybeSingle();

      if (existingAccount) {
        const { error } = await supabase
          .from("stripe-users")
          .update({
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_user_id", stripeUserId);

        if (error) {
          console.error("Supabase update error:", error);
          return NextResponse.json(
            { error: "Database update failed" },
            { status: 500 }
          );
        }
      }
      break;
  }

  return NextResponse.json({ received: true });
}