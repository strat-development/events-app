"use client"

import { CustomUserPage } from "@/features/custom-user-page/CustomUserPage";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UserProfilePage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const profileUserId = params.slug;
    const { userId, loading } = useUserContext();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !userId) {
            router.push('/');
        }
    }, [loading, userId, router]);

    return (
        <div className="mt-24 max-w-[1200px] w-full justify-self-center">
            <CustomUserPage userId={profileUserId} />
        </div>
    )
}