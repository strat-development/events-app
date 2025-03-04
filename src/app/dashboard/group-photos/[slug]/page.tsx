"use client"

import { CreateGroupImagesAlbumDialog } from "@/components/dashboard/modals/groups/CreateGroupImagesAlbumDialog";
import { Navbar } from "@/components/dashboard/Navbar";
import { GroupGallery } from "@/features/group-page/GroupGallery";
import { GroupHero } from "@/features/group-page/GroupHero";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import GridLoader from "react-spinners/GridLoader";

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
        if (!loading && userId === null && ownerId === null) {
            router.push('/');
        }
    }, [loading, userId, router, ownerId]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <GridLoader className="opacity-50" color="#fff" size={24} margin={2} />
            </div>
        )
    }

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