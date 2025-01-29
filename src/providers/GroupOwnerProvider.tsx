import {
    useSessionContext,
    useUser as useSupaUser,
} from "@supabase/auth-helpers-react";
import { createContext, useContext, useEffect, useState } from "react";
import { useUserContext } from "./UserContextProvider";

type GroupOwnerContextType = {
    ownerId: string;
    setOwnerId: (ownerId: string) => void;
    eventCreatorId: string;
    setEventCreatorId: (eventCreatorId: string) => void;
    clearIds: () => void;
};

export const GroupOwnerContext = createContext<GroupOwnerContextType | null>(null);

export default function GroupOwnerContextProvider({ children }: { children: React.ReactNode }) {
    const [ownerId, setOwnerId] = useState<string>("");
    const [eventCreatorId, setEventCreatorId] = useState<string>("");
    const { userId } = useUserContext();
    const { supabaseClient: supabase } = useSessionContext();
    const user = useSupaUser();

    const clearIds = () => {
        setOwnerId("");
        setEventCreatorId("");
    };

    useEffect(() => {
        if (user && userId) {
            const getGroupOwner = async () => {
                const { data: creatorData, error } = await supabase
                    .from("groups")
                    .select("group_owner")
                    .eq("group_owner", userId);

                if (error) {
                    console.log("Error fetching group owner:", error);
                }

                if (creatorData && creatorData.length > 0) {
                    setOwnerId(creatorData[0].group_owner);
                }
            };
            getGroupOwner();
        }
    }, [user, userId, supabase]);

    useEffect(() => {
        if (user && userId) {
            const getEventCreator = async () => {
                const { data: creatorData, error } = await supabase
                    .from("events")
                    .select("created_by")
                    .eq("created_by", userId);

                if (error) {
                    console.log("Error fetching event creator:", error);
                }

                if (creatorData && creatorData.length > 0) {
                    setEventCreatorId(creatorData[0].created_by);
                }
            };
            getEventCreator();
        }
    }, [user, userId, supabase]);

    return (
        <GroupOwnerContext.Provider
            value={{
                ownerId,
                setOwnerId,
                eventCreatorId,
                setEventCreatorId,
                clearIds,
            }}>
            {children}
        </GroupOwnerContext.Provider>
    );
}

export function useGroupOwnerContext() {
    const context = useContext(GroupOwnerContext);
    if (!context) {
        throw new Error("useGroupOwnerContext must be used within a GroupOwnerContextProvider");
    }
    return context;
}
