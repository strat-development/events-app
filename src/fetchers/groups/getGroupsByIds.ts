
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { GroupData } from "@/types/types";

export const getGroupsByIds = async (groupIds: string[]): Promise<GroupData[]> => {
  if (groupIds.length === 0) {
    return [];
  }

  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds);

  if (error) {
    throw new Error(`Failed to fetch groups: ${error.message}`);
  }

  return data || [];
};
