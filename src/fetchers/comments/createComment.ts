import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

interface CreateCommentData {
  comment_content: string;
  post_id: string;
  user_id: string;
}

export const createComment = async (commentData: CreateCommentData): Promise<void> => {
  const supabase = createClientComponentClient<Database>();

  const { error } = await supabase
    .from('post-comments')
    .insert(commentData);

  if (error) {
    throw new Error(`Failed to create comment: ${error.message}`);
  }
};
