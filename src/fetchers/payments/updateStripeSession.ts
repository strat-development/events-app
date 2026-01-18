import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { StripeSession } from "@/types/types";

interface UpdateStripeSessionData {
  sessionId: string;
  status: StripeSession['status'];
  paymentIntentId?: string;
  amountTotal?: number;
  currency?: string;
}

export const updateStripeSession = async (
  updateData: UpdateStripeSessionData
): Promise<StripeSession> => {
  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from('stripe-sessions')
    .update({
      status: updateData.status,
      payment_intent_id: updateData.paymentIntentId,
      amount_total: updateData.amountTotal,
      currency: updateData.currency,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_session_id', updateData.sessionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update Stripe session: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to update Stripe session: No data returned');
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
  }
};
