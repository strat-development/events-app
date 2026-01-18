
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { InterestData } from "@/types/types";

export const getInterests = async (): Promise<InterestData[]> => {
  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from("interests")
    .select("*");

  if (error) {
    throw new Error(`Failed to fetch interests: ${error.message}`);
  }

  return data || [];
};
