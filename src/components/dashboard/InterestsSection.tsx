"use client"

import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState } from "react"
import { useMutation, useQuery } from "react-query"
import { useUserContext } from "@/providers/UserContextProvider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Input } from "../ui/input"
import { Button } from "../ui/button"

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

interface UserData {
    user_interests: string[]
    id: string
}

export const InterestsSection = () => {
    const supabase = createClientComponentClient<Database>()
    const [interestsData, setInterestsData] = useState<InterestData | null>(null)
    const [selectedInterests, setSelectedInterests] = useState<string[]>([])
    const [selectedGroup, setSelectedGroup] = useState<string | null>("all")
    const [searchQuery, setSearchQuery] = useState<string>("")
    const { userId } = useUserContext()

    useQuery("interests", async () => {
        const { data, error } = await supabase
            .from("interests")
            .select("*")
        if (error) {
            throw error
        }

        if (data && data.length > 0) {
            setInterestsData(data[0].interest_group as unknown as InterestData)
        }

        return data
    })

    const handleInterestClick = (interestName: string) => {
        setSelectedInterests((prevSelected) =>
            prevSelected.includes(interestName)
                ? prevSelected.filter((name) => name !== interestName)
                : [...prevSelected, interestName]
        )
    }

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value)
    }

    const addInterests = useMutation(async (userData: UserData) => {
        const { data, error } = await supabase
            .from("users")
            .upsert(userData)
            .eq("id", userId)
        if (error) {
            throw error
        }
        return data
    })

    return (
        <div>
            <h1 className="text-2xl font-bold">Interests</h1>
            <div className="mb-4">
                <label htmlFor="group-select" className="block text-lg font-medium">Select Interest Group:</label>
                <Select
                    value={selectedGroup || "all"}
                    onValueChange={(value: string) => setSelectedGroup(value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select interest group" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Groups</SelectItem>
                        {interestsData?.["interest-groups"].map((group) => (
                            <SelectItem
                                value={group["group-name"]}
                                key={group["group-name"]}
                            >
                                {group["group-name"]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="mb-4">
                <label htmlFor="search-input" className="block text-lg font-medium">Search Interests:</label>
                <Input
                    id="search-input"
                    type="text"
                    placeholder="Search interests"
                    value={searchQuery}
                    onChange={handleSearchChange}
                />
            </div>
            <div className="flex flex-col gap-4">
                {interestsData?.["interest-groups"]
                    .filter((group) => selectedGroup === "all" || group["group-name"] === selectedGroup)
                    .map((group) => (
                        <div key={group["group-name"]} className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                {group.interests
                                    .filter((interest) => !selectedInterests.includes(interest.name))
                                    .filter((interest) => interest.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map((interest) => (
                                        <button
                                            key={interest.name}
                                            className="px-4 py-2 border bg-white text-black"
                                            onClick={() => handleInterestClick(interest.name)}
                                        >
                                            {interest.name}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    ))}
            </div>
            <div>
                {selectedInterests.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold">Selected Interests</h2>
                        <div className="flex gap-2">
                            {selectedInterests.map((interest) => (
                                <button
                                    key={interest}
                                    className="px-4 py-2 border bg-blue-500 text-white"
                                    onClick={() => handleInterestClick(interest)}
                                >
                                    {interest}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <Button onClick={
                () => {
                    if (userId) {
                        addInterests.mutateAsync({
                            user_interests: selectedInterests,
                            id: userId
                        } as UserData)
                    }
                }
            }>
                Save Interests
            </Button>
        </div>
    )
}