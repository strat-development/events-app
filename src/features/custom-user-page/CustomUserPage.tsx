import { useUserContext } from "@/providers/UserContextProvider";
import { UserProfileSection } from "./UserProfileSection"
import { UserInterestsSection } from "./UserInterestsSection";
import { UserGroupsSection } from "./UserGroupsSection";
import { UserPostsSection } from "./UserPostsSection";

interface CustomUserPageProps {
    userIdFromUrl: string;
}

export const CustomUserPage = ({ userIdFromUrl }: CustomUserPageProps) => {
    const { userRole, userId } = useUserContext();

    return (
        <div className="flex flex-row flex-wrap gap-8 justify-center w-full min-[768px]:justify-between">
            <UserProfileSection userRole={userRole}
                userId={userId || userIdFromUrl} />
            <div className="flex flex-col gap-8 w-full min-[900px]:max-w-[600px]">
                <UserInterestsSection userId={userId || userIdFromUrl} />
                <div className="flex flex-col gap-16">
                    <UserGroupsSection />
                    <UserPostsSection />
                </div>
            </div>
        </div>
    )
}