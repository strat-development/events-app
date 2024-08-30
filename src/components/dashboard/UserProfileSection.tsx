import { Modal } from "@/features/Modal";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useQuery } from "react-query";
import { Toaster } from "../ui/toaster";
import { UserDataModal } from "./UserDataModal";



export const UserProfileSection = () => {
    const supabase = createClientComponentClient<Database>();
    const { userRole, userId } = useUserContext();


    const bodyContent = (
        <>
            <UserDataModal />
        </>
    )

    const getUserData = useQuery(
        ['users'],
        async () => {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", userId)

            if (error) {
                throw error;
            }

            return data;
        },
        {
            enabled: !!userId
        }
    )

    return (
        <>



            <div>
                {getUserData.data?.map((user) => (
                    <div key={user.id}>
                        <h2>{user.first_name} {user.last_name}</h2>
                        <p>{user.email}</p>
                        <p>{user.city}, {user.country}</p>
                    </div>
                ))}
                {getUserData.isLoading && <div>Loading...</div>}
            </div>

            {!userRole && (
                <Modal title="Create User"
                    body={bodyContent}
                    isOpen={true}
                    onClose={() => { }}
                />
            )}

            <Toaster />
        </>
    )
}

