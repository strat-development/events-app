import { useMutation, useQuery } from "react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

export const useStripeProducts = () => {
  const supabase = createClientComponentClient<Database>();

  const getProductByEventId = (eventId: string) => 
    useQuery(['stripe-product', eventId], async () => {
      const { data, error } = await supabase
        .from('stripe-products')
        .select('*')
        .eq('event_id', eventId)
        .single();

      if (error) throw error;
      return data;
    });

  const createProduct = useMutation(async (productData: {
    eventId: string;
    name: string;
    description: string;
    price: number;
    metadata: Record<string, string>;
    stripeAccountId: string;
  }) => {
    const stripeResponse = await fetch('/api/create-stripe-product', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...productData,
        stripeAccountId: productData.stripeAccountId
      }),
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.json();
      throw new Error(errorData.error || 'Failed to create Stripe product');
    }

    const stripeData = await stripeResponse.json();

    const { data, error } = await supabase
      .from('stripe-products')
      .insert({
        event_id: productData.eventId,
        stripe_product_id: stripeData.productId,
        stripe_price_id: stripeData.priceId,
        stripe_account_id: productData.stripeAccountId
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      stripeData
    };
  });

  return { createProduct, getProductByEventId };
};