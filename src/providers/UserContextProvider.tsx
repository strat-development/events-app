import {
    useSessionContext,
    useUser as useSupaUser
} from "@supabase/auth-helpers-react";
import { createContext, useContext, useEffect, useState } from "react";

type UserContextType = {
    userRole: string;
    setUserRole: (userRole: string) => void;
    userName: string;
    setUserName: (userName: string) => void;
    userEmail: string;
    setUserEmail: (userEmail: string) => void;
    userId: string;
    setUserId: (userId: string) => void;
    clearUserRole: () => void;
};

export const UserContext = createContext<UserContextType | null>(null);

export default function UserContextProvider({ children }: { children: React.ReactNode }) {
    const [userRole, setUserRole] = useState<string>("");
    const [userName, setUserName] = useState<string>("");
    const [userEmail, setUserEmail] = useState<string>("");
    const [userId, setUserId] = useState<string>("");
    const {
        supabaseClient: supabase
    } = useSessionContext();
    const user = useSupaUser();
    const clearUserRole = () => setUserRole("");

    useEffect(() => {
        if (user) {
            const getUserRole = async () => {
                const { data: userData, error } = await supabase
                    .from("users")
                    .select("user_role, full_name, email, id")
                    .eq("id", user.id)
                    .single();
                    
                if (error) {
                    console.log(error);
                }

                if (userData) {
                    setUserRole(userData.user_role);
                    setUserName(userData.full_name);
                    setUserEmail(userData.email);
                    setUserId(userData.id);
                }
            };
            getUserRole();
        }
    }, [user, supabase]);

    return (
        <UserContext.Provider value={{ 
            userRole, 
            setUserRole, 
            userName, 
            setUserName, 
            userEmail,
            setUserEmail,
            userId,
            setUserId,
            clearUserRole }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUserContext() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error(
            "useUserContext must be used within a UserContextProvider"
        );
    }
    return context;
}