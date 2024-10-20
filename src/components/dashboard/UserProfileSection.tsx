"use client"

import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useQuery } from "react-query";
import { Toaster } from "../ui/toaster";
import { useEffect, useState } from "react";
import Image from "next/image";
import { EditUserProfileDialog } from "./modals/EditUserProfileDialog";
import { UserDataModal } from "./modals/UserDataDialog";
import { DeleteUserProfileImageDialog } from "./modals/DeleteUserProfileImageDialog";

export const UserProfileSection = () => {
    const supabase = createClientComponentClient<Database>();
    const { userRole, userId } = useUserContext();
    const [imageUrls, setImageUrls] = useState<{ publicUrl: string }[]>([]);

    const { data: images, isLoading } = useQuery(
        ['profile-pictures', userId],
        async () => {
            const { data, error } = await supabase
                .from('profile-pictures')
                .select('*')
                .eq('user_id', userId)
            if (error) {
                throw error;
            }
            return data || [];
        },
        {
            enabled: !!userId
        }
    );

    useEffect(() => {
        if (images) {
            Promise.all(images.map(async (image) => {
                const { data: publicURL } = await supabase.storage
                    .from('profile-pictures')
                    .getPublicUrl(image.image_url)

                return { publicUrl: publicURL.publicUrl };

            }))
                .then((publicUrls) => setImageUrls(publicUrls))
                .catch(console.error);
        }
    }, [images]);

    const getUserData = useQuery(
        ['users'],
        async () => {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", userId)

            if (error) {
                throw error;
            }

            return data;
        },
        {
            enabled: !!userId
        }
    )

    return (
        <>
            <div>
                {getUserData.data?.map((user) => (
                    <div key={user.id}>
                        <div className="flex flex-col gap-4">
                            <Image src={imageUrls[0]?.publicUrl} alt="profile picture" width={200} height={200} />
                            <DeleteUserProfileImageDialog />
                        </div>
                        <h2>{user.full_name}</h2>
                        <p>{user.email}</p>
                        <p>{user.city}, {user.country}</p>
                    </div>
                ))}
                {getUserData.isLoading && <div>Loading...</div>}
            </div>

            <EditUserProfileDialog />

            {!userRole && (
                <UserDataModal />
            )}

            <Toaster />
        </>
    )
}

