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
        <div className="max-w-[1200px] w-full">
            <div className="flex flex-col gap-8 items-center w-full relative top-24">
                <div className="flex">
                    <UserProfileSection userRole={userRole}
                        userId={userId || userIdFromUrl} />
                    <div className="Flex-col">
                        <UserInterestsSection userId={userId || userIdFromUrl} />
                        <UserGroupsSection />
                    </div>
                </div>
            </div>
        </div>
    )
}