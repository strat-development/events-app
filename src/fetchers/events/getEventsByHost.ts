
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { EventData } from "@/types/types";

export const getEventsByHost = async (hostId: string): Promise<EventData[]> => {
  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq('created_by', hostId)
    .order('starts_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch events by host: ${error.message}`);
  }

  return data || [];
};
