
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

type EventPicture = Database["public"]["Tables"]["event-pictures"]["Row"];

export const getEventPictures = async (eventIds: string[]): Promise<EventPicture[]> => {
  if (eventIds.length === 0) {
    return [];
  }

  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from('event-pictures')
    .select('*')
    .in('event_id', eventIds);

  if (error) {
    throw new Error(`Failed to fetch event pictures: ${error.message}`);
  }

  return data || [];
};
