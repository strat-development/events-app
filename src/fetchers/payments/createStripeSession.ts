import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { StripeSession } from "@/types/types";

interface CreateStripeSessionData {
  userId: string;
  eventId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  stripeAccountId?: string;
  metadata?: Record<string, string>;
}

interface StripeSessionResponse {
  sessionId: string;
  url: string;
}

export const createStripeSession = async (
  sessionData: CreateStripeSessionData
): Promise<StripeSession & { url: string }> => {
  const supabase = createClientComponentClient<Database>();

  const stripeResponse = await fetch('/api/create-stripe-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId: sessionData.priceId,
      successUrl: sessionData.successUrl,
      cancelUrl: sessionData.cancelUrl,
      stripeAccountId: sessionData.stripeAccountId,
      metadata: {
        user_id: sessionData.userId,
        event_id: sessionData.eventId
      }
    })
  });

  const responseData = await stripeResponse.json();

  if (!stripeResponse.ok) {
    throw new Error(responseData.error || 'Failed to create Stripe session');
  }

  const { data, error } = await supabase
    .from('stripe-sessions')
    .insert({
      user_id: sessionData.userId,
      event_id: sessionData.eventId,
      stripe_session_id: responseData.sessionId,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save Stripe session: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to create Stripe session: No data returned');
  }

  return {
    id: data.id,
    user_id: data.user_id,
    event_id: data.event_id || '',
    stripe_session_id: data.stripe_session_id || '',
    status: data.status as StripeSession['status'],
    payment_intent_id: data.payment_intent_id,
    amount_total: data.amount_total,
    currency: data.currenct || '',
    created_at: data.created_at || '',
    updated_at: data.updated_at || '',
    url: responseData.url   
  };
};
