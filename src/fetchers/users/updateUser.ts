
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { UserData } from "@/types/types";

export const updateUser = async (userId: string, userData: Partial<UserData>): Promise<void> => {
  const supabase = createClientComponentClient<Database>();
  
  const { error } = await supabase
    .from("users")
    .update(userData)
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
};
