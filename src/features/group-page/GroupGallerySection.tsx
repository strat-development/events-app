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

interface GroupGallerySectionProps {
    groupId: string;
}

export default function GroupGallerySectionPage({ groupId }: GroupGallerySectionProps) {
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
            <div className="flex flex-col gap-8 max-w-[1200px] w-full min-h-screen relative">
                {pathname.includes("/dashboard") && (
                    <div className="justify-self-end">
                        <CreateGroupImagesAlbumDialog groupId={groupId} />
                    </div>
                )}
                <GroupGallery groupId={groupId} />
            </div>
        </>
    )
}