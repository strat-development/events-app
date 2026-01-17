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
            <div className="flex flex-col mt-24 max-w-[1200px] w-full justify-self-center px-4">
                <GroupHero groupId={groupId} />
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-8">
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        {view === "about" && (
                            <GroupInfoSection groupId={groupId} />
                        ) || view === "photos" && (
                            <GroupGallerySectionPage groupId={groupId} />
                        ) || (
                                <GroupPostsSection groupId={groupId} />
                            )}
                        <EventsSection groupId={groupId} />
                    </div>
                    
                    <div className="lg:col-span-4">
                        <GroupMembersSidebar groupId={groupId} />
                    </div>
                </div>
            </div>
        </>
    )
}