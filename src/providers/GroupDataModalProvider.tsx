import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createContext, useContext, useState } from "react";
import { useQuery } from "react-query";

interface Interest {
    name: string
}

interface InterestGroup {
    "group-name": string
    interests: Interest[]
}

interface InterestData {
    "interest-groups": InterestGroup[]
}

type GroupDataContextType = {
    groupName: string
    setGroupName: (groupName: string) => void
    groupCity: string
    setGroupCity: (groupCity: string) => void
    groupCountry: string
    setGroupCountry: (groupCountry: string) => void
    interestsData: InterestData | null
    setInterestsData: (interestsData: InterestData | null) => void
    selectedInterests: string[]
    setSelectedInterests: (selectedInterests: string[]) => void
    selectedGroup: string | null
    setSelectedGroup: (selectedGroup: string | null) => void
    editorContent: string
    setEditorContent: (editorContent: string) => void
}

const GroupDataContext = createContext<GroupDataContextType | null>(null)

export default function GroupDataModalProvider({ children }: { children: React.ReactNode }) {
    const supabase = createClientComponentClient<Database>()

    const [interestsData, setInterestsData] = useState<InterestData | null>(null)
    const [selectedInterests, setSelectedInterests] = useState<string[]>([])
    const [selectedGroup, setSelectedGroup] = useState<string | null>("all")
    const [groupName, setGroupName] = useState<string>("")
    const [groupCity, setGroupCity] = useState<string>("")
    const [groupCountry, setGroupCountry] = useState<string>("")
    const [editorContent, setEditorContent] = useState<string>("")

    useQuery("interests", async () => {
        const { data, error } = await supabase
            .from("interests")
            .select("*")
            .limit(5)
        if (error) {
            throw error
        }

        if (data && data.length > 0) {
            setInterestsData(data[0].interest_group as unknown as InterestData)
        }

        return data
    },
        {
            cacheTime: 10 * 60 * 1000,
        })

    return (
        <GroupDataContext.Provider value={{
            groupName,
            setGroupName,
            groupCity,
            setGroupCity,
            groupCountry,
            setGroupCountry,
            interestsData,
            setInterestsData,
            selectedInterests,
            setSelectedInterests,
            selectedGroup,
            setSelectedGroup,
            editorContent,
            setEditorContent
        }}>
            {children}
        </GroupDataContext.Provider>
    )
}

export function useGroupDataContext() {
    const context = useContext(GroupDataContext)
    if (!context) {
        throw new Error("useGroupDataContext must be used within a GroupDataModalProvider")
    }
    return context
}