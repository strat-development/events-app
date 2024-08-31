import { GroupHero } from "./GroupHero"

interface GroupPageProps {
    groupId: string
}

export const CustomGroupPage = ({
    groupId
}: GroupPageProps) => {
    return (
        <>
            <div className="max-w-[1200px] w-full">
                <GroupHero groupId={groupId} />
            </div>
        </>
    )
}