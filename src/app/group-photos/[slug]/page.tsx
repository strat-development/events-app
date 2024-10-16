"use client"

import { CreateGroupImagesAlbumDialog } from "@/components/dashboard/modals/CreateGroupImagesAlbumDialog";
import { Navbar } from "@/components/dashboard/Navbar";
import { GroupGallery } from "@/features/group-page/GroupGallery";
import { GroupHero } from "@/features/group-page/GroupHero";

export default function GroupPhotosPage({
    params
}: {
    params: {
        slug: string
    }
}) {
    const groupId = params.slug;

    return (
        <>
            <div className="flex justify-between items-center h-[100vh]">
                <Navbar />
                <div className="flex flex-col gap-8 items-center w-full min-h-screen relative top-24">
                    <GroupHero groupId={groupId} />
                    <div>
                        <CreateGroupImagesAlbumDialog groupId={groupId} />
                    </div>
                    <div className="grid grid-cols-3 gap-8">
                        <GroupGallery
                            groupId={groupId} />
                    </div>
                </div>
            </div>
        </>
    )
}