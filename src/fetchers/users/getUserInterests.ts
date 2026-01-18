
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

export const getUserInterests = async (userId: string): Promise<string[]> => {
  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from("users")
    .select("user_interests")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch user interests: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return (data.user_interests as unknown as string[]) || [];
};
