
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

export const updateEventDescription = async (
  eventId: string,
  description: string
): Promise<void> => {
  const supabase = createClientComponentClient<Database>();
  
  const { error } = await supabase
    .from("events")
    .update({ event_description: description })
    .eq("id", eventId);

  if (error) {
    throw new Error(`Failed to update event description: ${error.message}`);
  }
};
