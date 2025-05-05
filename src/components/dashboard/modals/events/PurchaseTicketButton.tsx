"use client"

import { Button } from "@/components/ui/button";
import { useStripeProducts } from "@/hooks/useStripeProducts";
import { useStripeSessions } from "@/hooks/useStripeSessions";
import { useUserContext } from "@/providers/UserContextProvider";

export const PurchaseTicketButton = ({ eventId }: { eventId: string }) => {
  const { userId } = useUserContext();
  const { data: product } = useStripeProducts().createProduct
  const { createSession } = useStripeSessions();

  const handlePurchase = async () => {
    if (!product) {
      alert('This event is not configured for ticket purchases');
      return;
    }

    try {
      const session = await createSession.mutateAsync({
        userId: userId!,
        eventId,
        priceId: product.stripe_price_id as string,
        successUrl: `${window.location.origin}/events/${eventId}/success`,
        cancelUrl: `${window.location.origin}/events/${eventId}`
      });

      if (session) {
        window.location.href = session.stripe_session_id;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  return (
    <Button onClick={handlePurchase}>
      Purchase Ticket
    </Button>
  );
};