
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { UserData } from "@/types/types";

interface EventAttendeeWithUser {
  users: UserData | null;
}

export const getEventAttendees = async (
  eventId: string,
  limit?: number
): Promise<EventAttendeeWithUser[]> => {
  const supabase = createClientComponentClient<Database>();
  
  let query = supabase
    .from("event-attendees")
    .select(`
      users (
        *
      )
    `)
    .eq("event_id", eventId);

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch event attendees: ${error.message}`);
  }

  return data || [];
};
