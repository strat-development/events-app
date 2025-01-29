import { EventsSection } from "./EventsSection"
import { GroupHero } from "./GroupHero"
import { GroupInfoSection } from "./GroupInfoSection"
import { GroupMembersSidebar } from "./GroupMembersSidebar"

interface GroupPageProps {
    groupId: string
}

export const CustomGroupPage = ({
    groupId
}: GroupPageProps) => {
    return (
        <>
            <div className="flex flex-col mt-24 max-w-[1200px] w-full justify-self-center">
                <GroupHero groupId={groupId} />
                <div className="flex flex-wrap justify-between gap-8 relative">
                    <div className="flex flex-col w-full min-[1150px]:w-[70%]">
                        <GroupInfoSection groupId={groupId} />
                        <EventsSection groupId={groupId} />
                    </div>
                    <div className="relative">
                        <GroupMembersSidebar groupId={groupId} />
                    </div>
                </div>
            </div>
        </>
    )
}