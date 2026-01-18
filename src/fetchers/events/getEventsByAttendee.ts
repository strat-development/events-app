import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { EventData } from "@/types/types";

interface EventAttendeeResponse {
  events: EventData | null;
}

export const getEventsByAttendee = async (userId: string): Promise<EventAttendeeResponse[]> => {
  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from("event-attendees")
    .select(`
      events (
        *
      )
    `)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to fetch events by attendee: ${error.message}`);
  }

  return data || [];
};
