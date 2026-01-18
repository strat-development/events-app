
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { StripeProductsData } from "@/types/types";

export const getStripeProduct = async (eventId: string): Promise<StripeProductsData | null> => {
  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from('stripe-products')
    .select('*')
    .eq('event_id', eventId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch Stripe product: ${error.message}`);
  }

  return data;
};
