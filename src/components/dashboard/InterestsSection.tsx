"use client"

import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { useUserContext } from "@/providers/UserContextProvider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { useGroupDataContext } from "@/providers/GroupDataModalProvider"
import { Save } from "lucide-react"

interface UserData {
    user_interests: string[]
    id: string
}

interface Interest {
    name: string
}

interface InterestGroup {
    "group-name": string
    interests: Interest[]
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
    const [displayedInterests, setDisplayedInterests] = useState<Interest[]>([]);

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
            setUserInterests(data[0].user_interests as unknown as string[])
        }

        return data
    }, {
        enabled: !!userId,
        cacheTime: 10 * 60 * 1000,
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

    const shuffleInterests = () => {
        if (!interestsData) return;

        const allInterests = interestsData["interest-groups"]
            .filter((group) => selectedGroup === "all" || group["group-name"] === selectedGroup)
            .flatMap((group) => group.interests)
            .filter((interest) => !selectedInterests.includes(interest.name))
            .filter((interest) => interest.name.toLowerCase().includes(searchQuery.toLowerCase()));

        const shuffledInterests = allInterests.sort(() => 0.5 - Math.random()).slice(0, 20);
        setDisplayedInterests(shuffledInterests);
    };

    useEffect(() => {
        shuffleInterests();
    }, [interestsData, selectedGroup, searchQuery]);

    const addInterests = useMutation(async () => {
        if (!userId) return;

        const { data, error: fetchError } = await supabase
            .from("users")
            .select("user_interests")
            .eq("id", userId)
            .single();

        if (fetchError) throw fetchError;

        const existingInterests: string[] = data?.user_interests as string[] || [];

        const updatedInterests = Array.from(new Set([...existingInterests, ...selectedInterests]));

        const { error: updateError } = await supabase
            .from("users")
            .update({ user_interests: updatedInterests })
            .eq("id", userId);

        if (updateError) throw updateError;

        return updatedInterests;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries("userInterests");
        }
    });

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
        <div className="flex flex-col gap-8 min-h-[90vh]">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-wider">Interests</h1>
                <p className="text-white/70">Select to remove</p>
            </div>

            <div className="flex gap-2">
                <div className="flex gap-4 flex-wrap">
                    {userInterests && (
                        userInterests.map((interest, index) => (
                            <Button variant="outline"
                                onClick={() => {
                                    handleInterestToRemoveClick(interest)
                                }}
                                id={`user-interest-${index}`}
                                key={index}
                                className={`px-4 py-2 border ${interestsToDelete.includes(interest) ? 'border border-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
                                {interest}
                            </Button>
                        )))}
                </div>

                {interestsToDelete.length > 0 && (
                    <Button variant="destructive"
                        onClick={() => {
                            removeInterests(interestsToDelete)
                            setInterestsToDelete([])
                        }}>
                        Remove Selected
                    </Button>
                )}
            </div>
            <div className="flex items-center gap-4">
                <div className="mb-4 flex flex-col gap-2">
                    <label htmlFor="group-select" className="block text-lg text-white/70 font-medium">Select Interest Group:</label>
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
                                    key={group["group-name"]}>
                                    {group["group-name"]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <p>
                    OR
                </p>
                <div className="mb-4 flex flex-col gap-2">
                    <label htmlFor="search-input" className="block text-lg text-white/70 font-medium">Search Interests:</label>
                    <Input
                        id="search-input"
                        type="text"
                        placeholder="Search interests"
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>
            <div className="flex flex-wrap gap-4 min-[900px]:max-w-[60%]">
                {displayedInterests.map((interest) => (
                    <Button key={interest.name}
                        variant="outline"
                        onClick={() => handleInterestClick(interest.name)}>
                        {interest.name}
                    </Button>
                ))}
            </div>

            <Button
                variant="ghost"
                className="text-blue-500 w-fit"
                onClick={shuffleInterests}>
                Show More Interests
            </Button>

            <div className="flex flex-col gap-8">
                {selectedInterests.length > 0 && (
                    <div className="flex flex-col gap-4">
                        <h2 className="text-xl tracking-wider font-semibold">Selected Interests</h2>
                        <div className="flex flex-wrap gap-4 min-[900px]:max-w-[60%]">
                            {selectedInterests.map((interest) => (
                                <Button key={interest}
                                    className="px-4 py-2 bg-transparent border border-blue-500 text-white"
                                    onClick={() => handleInterestClick(interest)}>
                                    {interest}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
                {selectedInterests.length > 0 && (
                    <Button variant="ghost"
                        className="w-fit text-blue-500"
                        onClick={() => {
                            if (userId) {
                                addInterests.mutateAsync()
                            }

                            setSelectedInterests([])
                        }}>
                        <Save size={20} />
                    </Button>

                )}
            </div>
        </div >
    )
}