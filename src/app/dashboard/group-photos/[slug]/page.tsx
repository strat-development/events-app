"use client"

import { CreateGroupImagesAlbumDialog } from "@/components/dashboard/modals/groups/CreateGroupImagesAlbumDialog";
import { Navbar } from "@/components/dashboard/Navbar";
import { GroupGallery } from "@/features/group-page/GroupGallery";
import { GroupHero } from "@/features/group-page/GroupHero";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function GroupPhotosPage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const groupId = params.slug;
    const { userId, loading } = useUserContext();
    const { ownerId } = useGroupOwnerContext();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !userId && !ownerId) {
            router.push('/');
        }
    }, [loading, userId, ownerId, router]);

    return (
        <>
            {ownerId === userId && ownerId.length > 0 && userId.length > 0 && (
                <div className="flex justify-self-center justify-between items-start min-h-screen max-w-[1200px] w-full">
                    <Navbar />
                    <div className="flex flex-col gap-8 max-w-[1200px] w-full min-h-screen relative top-24">
                        <GroupHero groupId={groupId} />
                        {pathname.includes("/dashboard") && (
                            <div className="jusify-self-end">
                                <CreateGroupImagesAlbumDialog groupId={groupId} />
                            </div>
                        )}
                        <GroupGallery groupId={groupId} />
                    </div>
                </div>
            )}
        </>
    )
}