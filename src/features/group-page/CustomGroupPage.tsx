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
            <div className="max-w-[1200px] w-full justify-self-center">
                <div className="flex justify-between pb-24">
                    <div className="flex flex-col gap-8 items-center min-h-screen w-full relative top-24">
                        <GroupHero groupId={groupId} />
                        <GroupInfoSection groupId={groupId} />
                        <EventsSection groupId={groupId} />
                    </div>
                    <div className="w-[30%] max-[900px]:hidden">
                        {/* Add any sidebar component if needed */}
                    </div>
                </div>
                <div className="sticky bottom-0">
                    {/* Add any navbar component if needed */}
                </div>
            </div>
        </>
    )
}