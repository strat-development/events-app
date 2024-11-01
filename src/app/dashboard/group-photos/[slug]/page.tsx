"use client"

import { CreateGroupImagesAlbumDialog } from "@/components/dashboard/modals/CreateGroupImagesAlbumDialog";
import { GroupGallery } from "@/features/group-page/GroupGallery";
import { GroupHero } from "@/features/group-page/GroupHero";
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider";
import { useUserContext } from "@/providers/UserContextProvider";
import { useRouter } from "next/navigation";

export default function GroupPhotosPage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const groupId = params.slug;
    const { userId } = useUserContext();
    const { ownerId } = useGroupOwnerContext();
    const router = useRouter();

    if (!ownerId || !userId) {
        router.push('/');
        return null
    }

    return (
        <>
            {ownerId === userId && ownerId.length > 0 && userId.length > 0 && (
                <div className="flex justify-between items-center h-[100vh]">
                    <div className="flex flex-col gap-8 items-center w-full min-h-screen relative top-24">
                        <GroupHero groupId={groupId} />
                        {window.location.pathname.includes("/dashboard") && (
                            <div>
                                <CreateGroupImagesAlbumDialog groupId={groupId} />
                            </div>
                        )}
                        <div className="grid grid-cols-3 gap-8">
                            <GroupGallery
                                groupId={groupId} />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}