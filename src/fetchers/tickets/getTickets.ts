
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { TicketsData } from "@/types/types";

export const getTickets = async (userId: string): Promise<{
  active: TicketsData[];
  expired: TicketsData[];
}> => {
  const supabase = createClientComponentClient<Database>();
  const today = new Date().toISOString();

  const { data: activeData, error: activeError } = await supabase
    .from('event-tickets')
    .select('*')
    .gte('event_starts_at', today)
    .eq('user_id', userId);

  const { data: expiredData, error: expiredError } = await supabase
    .from('event-tickets')
    .select('*')
    .lt('event_starts_at', today)
    .eq('user_id', userId);

  if (activeError || expiredError) {
    throw new Error(
      `Failed to fetch tickets: ${activeError?.message || expiredError?.message}`
    );
  }

  return {
    active: activeData || [],
    expired: expiredData || [],
  };
};
