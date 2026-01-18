
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

export const getEventDescription = async (eventId: string): Promise<string> => {
  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from("events")
    .select("event_description")
    .eq("id", eventId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch event description: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Event with id ${eventId} not found`);
  }

  return (data.event_description as string) || "";
};
