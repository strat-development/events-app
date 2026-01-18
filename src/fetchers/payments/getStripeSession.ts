
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { StripeSession } from "@/types/types";

export const getStripeSession = async (sessionId: string): Promise<StripeSession | null> => {
  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from('stripe-sessions')
    .select('*')
    .eq('stripe_session_id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch Stripe session: ${error.message}`);
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
  };
};
