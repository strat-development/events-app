import { useMutation, useQuery, useQueryClient } from "react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { StripeSession } from "@/types/types";

export const useStripeSessions = () => {
  const supabase = createClientComponentClient<Database>();
  const queryClient = useQueryClient();

  const getSessionById = (sessionId: string) => 
    useQuery(['stripe-session', sessionId], async () => {
      const { data, error } = await supabase
        .from('stripe-sessions')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .single();

      if (error) throw error;

      return data as StripeSession;
    });

  const createSession = useMutation(async (sessionData: {
    userId: string;
    eventId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }) => {
    const stripeResponse = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        priceId: sessionData.priceId,
        successUrl: sessionData.successUrl,
        cancelUrl: sessionData.cancelUrl,
        metadata: {
          user_id: sessionData.userId,
          event_id: sessionData.eventId
        }
      })
    });

    const stripeData = await stripeResponse.json();
    if (!stripeResponse.ok) throw new Error(stripeData.error);

    const { data, error } = await supabase
      .from('stripe-sessions')
      .insert({
        user_id: sessionData.userId,
        event_id: sessionData.eventId,
        stripe_session_id: stripeData.sessionId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return data as StripeSession;
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries('stripe-sessions');
    }
  });

  const updateSession = useMutation(async (updateData: {
    sessionId: string;
    status: StripeSession['status'];
    paymentIntentId?: string;
    amountTotal?: number;
    currency?: string;
  }) => {
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

    if (error) throw error;

    return data as StripeSession;
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries('stripe-sessions');
    }
  });

  return { getSessionById, createSession, updateSession };
};