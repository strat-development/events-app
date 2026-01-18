
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

type GroupPicture = Database["public"]["Tables"]["group-pictures"]["Row"];

export const getGroupPictures = async (groupIds: string[]): Promise<GroupPicture[]> => {
  if (groupIds.length === 0) {
    return [];
  }

  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from('group-pictures')
    .select('*')
    .in('group_id', groupIds);

  if (error) {
    throw new Error(`Failed to fetch group pictures: ${error.message}`);
  }

  return data || [];
};
