"use client"

import { Button } from "@/components/ui/button";
import { useStripeSessions } from "@/hooks/useStripeSessions";
import { useStripeProducts } from "@/hooks/useStripeProducts";
import { useUserContext } from "@/providers/UserContextProvider";

export const PurchaseTicketButton = ({ eventId }: { eventId: string }) => {
  const { userId } = useUserContext();
  const { getProductByEventId } = useStripeProducts();
  const { createSession } = useStripeSessions();

  const { data: stripeProduct, isLoading, error } = getProductByEventId(eventId);

  const handlePurchase = async () => {
    if (!stripeProduct?.stripe_price_id) {
      alert("This event has no ticket price configured");
      return;
    }

    if (!stripeProduct?.stripe_account_id) {
      alert("Organizer hasn't completed payment setup");
      return;
    }

    try {
      const response = await createSession.mutateAsync({
        userId,
        eventId,
        priceId: stripeProduct.stripe_price_id,
        stripeAccountId: stripeProduct.stripe_account_id,
        successUrl: `${window.location.origin}/event-page/${eventId}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/event-page/${eventId}`,
      });

      if (!response?.url) {
        throw new Error("No checkout URL received");
      }

      window.location.href = response.url;
    } catch (error) {
      console.error("Payment error:", error);
      alert(`Payment failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  if (isLoading) return <Button disabled>Loading...</Button>;
  if (error) return <Button disabled>Purchase unavailable</Button>;

  return (
    <Button onClick={handlePurchase} disabled={!stripeProduct}>
      Purchase Ticket
    </Button>
  );
}