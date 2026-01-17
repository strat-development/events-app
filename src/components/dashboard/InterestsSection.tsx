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

interface Interest {
    name: string
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
        <div className="flex flex-col gap-6 min-h-[90vh]">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                <h1 className="text-3xl font-bold tracking-wider bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    Your Interests
                </h1>
                <p className="text-white/60 mt-2">Manage your interests to get personalized event recommendations</p>
            </div>

            {userInterests && userInterests.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-white/90">Current Interests</h2>
                        {interestsToDelete.length > 0 && (
                            <Button 
                                variant="destructive"
                                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400"
                                onClick={() => {
                                    removeInterests(interestsToDelete)
                                    setInterestsToDelete([])
                                }}
                            >
                                Remove Selected ({interestsToDelete.length})
                            </Button>
                        )}
                    </div>
                    <p className="text-white/50 text-sm mb-4">Click to select interests you want to remove</p>
                    <div className="flex gap-2 flex-wrap">
                        {userInterests.map((interest, index) => (
                            <Button 
                                variant="outline"
                                onClick={() => handleInterestToRemoveClick(interest)}
                                id={`user-interest-${index}`}
                                key={index}
                                className={`px-4 py-2 transition-all duration-300 ${
                                    interestsToDelete.includes(interest) 
                                        ? 'bg-red-500/20 border-red-500 text-white' 
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/90'
                                }`}
                            >
                                {interest}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-semibold text-white/90 mb-4">Add New Interests</h2>
                <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                        <label htmlFor="group-select" className="text-sm text-white/70 font-medium">Filter by Category</label>
                        <Select
                            value={selectedGroup || "all"}
                            onValueChange={(value: string) => setSelectedGroup(value)}
                        >
                            <SelectTrigger className="bg-white/5 border-white/10">
                                <SelectValue placeholder="Select interest group" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
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
                    <div className="flex items-center justify-center text-white/50 font-medium px-4">
                        OR
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                        <label htmlFor="search-input" className="text-sm text-white/70 font-medium">Search Interests</label>
                        <Input
                            id="search-input"
                            type="text"
                            placeholder="Type to search..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="bg-white/5 border-white/10"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-white/90 mb-4">Available Interests</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                    {displayedInterests.map((interest) => (
                        <Button 
                            key={interest.name}
                            variant="outline"
                            onClick={() => handleInterestClick(interest.name)}
                            className={`px-4 py-2 transition-all duration-300 ${
                                selectedInterests.includes(interest.name)
                                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 border-transparent text-white'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/90'
                            }`}
                        >
                            {interest.name}
                        </Button>
                    ))}
                </div>
                <Button
                    variant="ghost"
                    className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
                    onClick={shuffleInterests}
                >
                    Show More Interests
                </Button>
            </div>
                        
            {selectedInterests.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-white/90">Selected to Add ({selectedInterests.length})</h2>
                        <Button 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                            onClick={() => {
                                if (userId) {
                                    addInterests.mutateAsync()
                                }
                                setSelectedInterests([])
                            }}
                        >
                            <Save size={18} />
                            Save Interests
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedInterests.map((interest) => (
                            <Button 
                                key={interest}
                                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 border-transparent text-white"
                                onClick={() => handleInterestClick(interest)}
                            >
                                {interest}
                            </Button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}