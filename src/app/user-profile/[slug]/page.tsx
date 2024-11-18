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
        <div className="mt-24 max-w-[1200px] w-full justify-self-center">
            <CustomUserPage userIdFromUrl={profileUserId} />
        </div>
    )
}