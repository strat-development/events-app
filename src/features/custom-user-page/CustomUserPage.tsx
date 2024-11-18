import { useUserContext } from "@/providers/UserContextProvider";
import { UserProfileSection } from "./UserProfileSection"
import { UserInterestsSection } from "./UserInterestsSection";
import { UserGroupsSection } from "./UserGroupsSection";

interface CustomUserPageProps {
    userIdFromUrl: string;
}

export const CustomUserPage = ({ userIdFromUrl }: CustomUserPageProps) => {
    const { userRole, userId } = useUserContext();

    return (
        <div className="flex flex-row flex-wrap gap-8 justify-start w-full min-[480px]:justify-between">
            <UserProfileSection userRole={userRole}
                userId={userId || userIdFromUrl} />
            <div className="flex flex-col gap-8">
                <UserInterestsSection userId={userId || userIdFromUrl} />
                <UserGroupsSection />
            </div>
        </div>
    )
}