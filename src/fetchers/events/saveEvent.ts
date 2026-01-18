
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

interface SaveEventData {
  user_id: string;
  event_name: string;
  event_city: string;
  event_place: string;
  event_link: string;
  event_date: string;
  event_time: string;
}

export const saveEvent = async (eventData: SaveEventData): Promise<void> => {
  const supabase = createClientComponentClient<Database>();
  
  const { error } = await supabase
    .from("saved-events")
    .upsert(eventData);

  if (error) {
    throw new Error(`Failed to save event: ${error.message}`);
  }
};
