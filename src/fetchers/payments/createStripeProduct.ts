
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { StripeProductsData } from "@/types/types";

interface CreateStripeProductData {
  eventId: string;
  name: string;
  description: string;
  price: number;
  metadata: Record<string, string>;
  stripeAccountId: string;
}

interface StripeProductResponse {
  productId: string;
  priceId: string;
}

export const createStripeProduct = async (
  productData: CreateStripeProductData
): Promise<StripeProductsData & { stripeData: StripeProductResponse }> => {
  const supabase = createClientComponentClient<Database>();
    
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

  const stripeData: StripeProductResponse = await stripeResponse.json();

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

  if (error) {
    throw new Error(`Failed to save Stripe product: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to create Stripe product: No data returned');
  }

  return {
    ...data,
    stripeData
  };
};
