
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { UserData } from "@/types/types";

export const getUserById = async (userId: string): Promise<UserData> => {
  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  if (!data) {
    throw new Error(`User with id ${userId} not found`);
  }

  return data;
};
