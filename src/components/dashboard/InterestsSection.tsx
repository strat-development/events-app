"use client"

import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { useUserContext } from "@/providers/UserContextProvider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { useGroupDataContext } from "@/providers/GroupDataModalProvider"

interface UserData {
    user_interests: string[]
    id: string
}

export const InterestsSection = () => {
    const supabase = createClientComponentClient<Database>()
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState<string>("")
    const { userId } = useUserContext()
    const [userInterests, setUserInterests] = useState<string[]>([])
    const [interestsToDelete, setInterestsToDelete] = useState<string[]>([])
    const { interestsData,
        selectedGroup,
        selectedInterests,
        setSelectedInterests,
        setSelectedGroup
    } = useGroupDataContext()

    useQuery("userInterests", async () => {
        if (!userId) return
        const { data, error } = await supabase
            .from("users")
            .select("user_interests")
            .eq("id", userId)
        if (error) {
            throw error
        }

        if (data && data.length > 0) {
            setUserInterests(data[0].user_interests as string[])
        }

        return data
    }, {
        enabled: !!userId,
    })



    const handleInterestClick = (interest: string) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(selectedInterests.filter((selectedInterest) => selectedInterest !== interest))
        } else {
            setSelectedInterests([...selectedInterests, interest])
        }
    }

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    const addInterests = useMutation(async (userData: UserData) => {
        const { data, error } = await supabase
            .from("users")
            .upsert(userData)
            .eq("id", userId)

        if (error) {
            throw error
        }

        return data
    },
        {
            onSuccess: () => {
                queryClient.invalidateQueries("userInterests")
            }
        })

    const handleInterestToRemoveClick = (interestName: string) => {
        setInterestsToDelete((prevSelected) =>
            prevSelected.includes(interestName)
                ? prevSelected.filter((name) => name !== interestName)
                : [...prevSelected, interestName]
        );
    };


    const removeInterests = async (interests: string[]) => {
        const updatedInterests = userInterests.filter((interest) => !interests.includes(interest))
        const { data, error } = await supabase
            .from("users")
            .update({ user_interests: updatedInterests })
            .eq("id", userId)

        if (error) {
            console.log("Error removing interest:", error.message)
        }

        setUserInterests(updatedInterests)
    }

    return (
        <div>
            <h1 className="text-2xl font-bold">Interests</h1>
            <div className="flex gap-2">
                {userInterests && (
                    userInterests.map((interest, index) => (
                        <Button onClick={() => {
                            handleInterestToRemoveClick(interest)
                            console.log(index)
                        }
                        }
                            id={`user-interest-${index}`}
                            key={index}
                            className={`px-4 py-2 border ${interestsToDelete.includes(interest) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
                            {interest}
                        </Button>
                    )))}

                {interestsToDelete.length > 0 && (
                    <Button onClick={() => {
                        removeInterests(interestsToDelete)
                        setInterestsToDelete([])
                    }}
                        className="px-4 py-2 border bg-red-500 text-white">
                        Remove Selected
                    </Button>
                )}
            </div>
            <div className="flex gap-8 items-center">
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
                <p>
                    OR
                </p>
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
            </div>
            <div className="flex flex-col gap-4">
                {interestsData?.["interest-groups"]
                    .filter((group) => selectedGroup === "all" || group["group-name"] === selectedGroup)
                    .map((group, index) => (
                        <div key={group["group-name"]} className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                {group.interests
                                    .filter((interest) => !selectedInterests.includes(interest.name))
                                    .filter((interest) => interest.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map((interest) => (
                                        <Button key={interest.name}
                                            id={`interest-${index}`}
                                            className="px-4 py-2 border bg-white text-black"
                                            onClick={() => handleInterestClick(interest.name)}>
                                            {interest.name}
                                        </Button>
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
                                <Button key={interest}
                                    className="px-4 py-2 border bg-blue-500 text-white"
                                    onClick={() => handleInterestClick(interest)}>
                                    {interest}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <Button onClick={() => {
                if (userId) {
                    addInterests.mutateAsync({
                        user_interests: selectedInterests,
                        id: userId
                    } as UserData)
                }

                setSelectedInterests([])
            }}>
                Save Interests
            </Button>
        </div >
    )
}