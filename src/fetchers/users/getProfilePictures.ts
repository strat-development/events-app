
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

export const getProfilePictures = async (userIds: string[]): Promise<Record<string, string>> => {
  if (userIds.length === 0) {
    return {};
  }

  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from('profile-pictures')
    .select('user_id, image_url')
    .in('user_id', userIds);

  if (error) {
    throw new Error(`Failed to fetch profile pictures: ${error.message}`);
  }

  const urlMap: Record<string, string> = {};
  
  if (data) {
    await Promise.all(
      data.map(async (image) => {
        const { data: publicURL } = await supabase.storage
          .from('profile-pictures')
          .getPublicUrl(image.image_url);
        if (publicURL && image.user_id) {
          urlMap[image.user_id] = publicURL.publicUrl;
        }
      })
    );
  }

  return urlMap;
};
