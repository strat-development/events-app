import { useUserContext } from "@/providers/UserContextProvider";
import { UserProfileSection } from "./UserProfileSection"
import { UserInterestsSection } from "./UserInterestsSection";
import { UserGroupsSection } from "./UserGroupsSection";
import { UserPostsSection } from "./UserPostsSection";

interface CustomUserPageProps {
    userId: string;
}

export const CustomUserPage = ({ userId }: CustomUserPageProps) => {
    const { userRole } = useUserContext();

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 w-full">
                <div className="lg:col-span-4">
                    <UserProfileSection userRole={userRole} userId={userId} />
                </div>
                
                <div className="lg:col-span-8 flex flex-col gap-8">
                    <UserInterestsSection userId={userId} />
                    <UserGroupsSection userId={userId} />
                    <UserPostsSection userId={userId} />
                </div>
            </div>
        </>
    )
}