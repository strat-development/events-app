
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { UserData } from "@/types/types";

export const upsertUser = async (userData: UserData[]): Promise<void> => {
  const supabase = createClientComponentClient<Database>();
  
  const { error } = await supabase
    .from("users")
    .upsert(userData);

  if (error) {
    throw new Error(`Failed to upsert user: ${error.message}`);
  }
};
