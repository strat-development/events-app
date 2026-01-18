
import { useMutation, useQuery, useQueryClient } from "react-query";
import { getStripeSession } from "@/fetchers/payments/getStripeSession";
import { createStripeSession } from "@/fetchers/payments/createStripeSession";
import { updateStripeSession } from "@/fetchers/payments/updateStripeSession";
import { StripeSession } from "@/types/types";

interface CreateSessionData {
  userId: string;
  eventId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  stripeAccountId?: string;
  metadata?: Record<string, string>;
}

interface UpdateSessionData {
  sessionId: string;
  status: StripeSession['status'];
  paymentIntentId?: string;
  amountTotal?: number;
  currency?: string;
}

export const useStripeSessions = () => {
  const queryClient = useQueryClient();

  const getSessionById = (sessionId: string) =>
    useQuery(['stripe-session', sessionId], () => getStripeSession(sessionId));

  const createSession = useMutation(
    (sessionData: CreateSessionData) => createStripeSession(sessionData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('stripe-sessions');
      }
    }
  );

  const updateSession = useMutation(
    (updateData: UpdateSessionData) => updateStripeSession(updateData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('stripe-sessions');
      }
    }
  );

  return { getSessionById, createSession, updateSession };
};