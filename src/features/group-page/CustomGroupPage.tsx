import { EventsSection } from "./EventsSection"
import { GroupHero } from "./GroupHero"
import { GroupInfoSection } from "./GroupInfoSection"

interface GroupPageProps {
    groupId: string
}

export const CustomGroupPage = ({
    groupId
}: GroupPageProps) => {
    return (
        <>
            <div className="flex flex-col gap-8 items-center w-full min-h-screen relative top-24">
                <GroupHero groupId={groupId} />
                <GroupInfoSection groupId={groupId} />
                <EventsSection groupId={groupId} />
            </div>
        </>
    )
}