"use client"

import { CustomUserPage } from "@/features/custom-user-page/CustomUserPage";

export default function UserProfilePage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const userId = params.slug;   

    return (
        <div className="flex justify-between items-center h-[100vh]">
            <div>
                <CustomUserPage userIdFromUrl={userId} />
            </div>
        </div>
    )
}