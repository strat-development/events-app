
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

interface CreatePostData {
  post_content: string;
  user_id: string;
  post_title: string;
}

export const createPost = async (postData: CreatePostData): Promise<{ id: string }> => {
  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from("posts")
    .insert([postData])
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create post: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to create post: No data returned");
  }

  return data;
};
