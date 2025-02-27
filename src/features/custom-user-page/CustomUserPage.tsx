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
        <div className="flex max-[768px]:flex-col gap-8 justify-center w-full min-[768px]:justify-between">
            <UserProfileSection userRole={userRole}
                userId={userId} />
            <div className="flex flex-col gap-8 w-full min-[900px]:max-w-[600px]">
                <UserInterestsSection userId={userId} />
                <div className="flex flex-col gap-16">
                    <UserGroupsSection userId={userId} />
                    <UserPostsSection userId={userId} />
                </div>
            </div>
        </div>
    )
}