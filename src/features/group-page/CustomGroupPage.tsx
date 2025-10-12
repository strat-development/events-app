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
                <div className="flex gap-8">
                    <div className="flex flex-1 flex-col">
                        {view === "about" && (
                            <GroupInfoSection groupId={groupId} />
                        ) || view === "photos" && (
                            <GroupGallerySectionPage groupId={groupId} />
                        ) || (
                                <GroupPostsSection groupId={groupId} />
                            )}
                        <EventsSection groupId={groupId} />
                    </div>
                    <div className="w-[35%] flex-shrink-0">
                        <GroupMembersSidebar groupId={groupId} />
                    </div>
                </div>
            </div>
        </>
    )
}