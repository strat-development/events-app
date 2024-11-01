"use client"

import { CustomUserPage } from "@/features/custom-user-page/CustomUserPage";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";

export default function UserProfilePage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const profileUserId = params.slug;   
    const { userId } = useUserContext();
    const router = useRouter();

    if (!userId) {
        router.push('/');
        return null
    }

    return (
        <div className="flex justify-between items-center h-[100vh]">
            <div>
                <CustomUserPage userIdFromUrl={profileUserId} />
            </div>
        </div>
    )
}