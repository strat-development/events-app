
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { EventData } from "@/types/types";

export const getEventById = async (eventId: string): Promise<EventData> => {
  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch event: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Event with id ${eventId} not found`);
  }

  return data;
};
