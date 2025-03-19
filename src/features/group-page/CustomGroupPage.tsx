import { useViewContext } from "@/providers/pageViewProvider"
import { EventsSection } from "./EventsSection"
import GroupGallerySectionPage from "./GroupGallerySection"
import { GroupHero } from "./GroupHero"
import { GroupInfoSection } from "./GroupInfoSection"
import { GroupMembersSidebar } from "./GroupMembersSidebar"
import { GroupPostsSection } from "./GroupPostsSection"

interface GroupPageProps {
    groupId: string
}

export const CustomGroupPage = ({
    groupId
}: GroupPageProps) => {
    const { view } = useViewContext()

    return (
        <>
            <div className="flex flex-col mt-24 max-w-[1200px] w-full justify-self-center">
                <GroupHero groupId={groupId} />
                <div className="flex flex-wrap w-full justify-between gap-8 relative">
                    <div className="flex w-full flex-col min-[1140px]:w-[70%]">
                        {view === "about" && (
                            <GroupInfoSection groupId={groupId} />
                        ) || view === "photos" && (
                            <GroupGallerySectionPage groupId={groupId} />
                        ) || (
                                <GroupPostsSection groupId={groupId} />
                            )}
                        <EventsSection groupId={groupId} />
                    </div>
                    <GroupMembersSidebar groupId={groupId} />
                </div>
            </div>
        </>
    )
}