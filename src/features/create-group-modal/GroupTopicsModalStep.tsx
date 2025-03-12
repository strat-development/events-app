"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useGroupDataContext } from "@/providers/GroupDataModalProvider"

interface Interest {
    name: string
}

interface InterestGroup {
    "group-name": string
    interests: Interest[]
}

export const GroupTopicsModalStep = () => {
    const [searchQuery, setSearchQuery] = useState<string>("")
    const { interestsData, selectedGroup, selectedInterests, setSelectedInterests, setSelectedGroup } = useGroupDataContext()
    const [displayedInterests, setDisplayedInterests] = useState<Interest[]>([]);

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


    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-8 items-center">
                <div className="mb-4 flex flex-col gap-1">
                    <label htmlFor="group-select" className="block font-medium text-white/70">Select Group:</label>
                    <Select
                        value={selectedGroup || "all"}
                        onValueChange={(value: string) => setSelectedGroup(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select interest group" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem 
                            value="all">All Groups</SelectItem>
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
                <p>OR</p>
                <div className="mb-4 flex flex-col gap-1">
                    <label htmlFor="search-input" className="block font-medium text-white/70">Search Interests:</label>
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
                <div className="flex flex-wrap gap-4">
                    {displayedInterests.map((interest) => (
                        <Button
                            key={interest.name}
                            className="px-4 py-2 border bg-white text-black"
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
                {selectedInterests.length > 0 && (
                    <>
                        <h2 className="text-lg font-medium text-white/70">Selected Interests</h2>
                        <div className="flex flex-wrap gap-2 max-h-[124px] overflow-y-auto">
                            {selectedInterests.map((interest) => (
                                <Button
                                    key={interest}
                                    className="px-4 py-2 border bg-blue-500 text-white"
                                    onClick={() => handleInterestClick(interest)}>
                                    {interest}
                                </Button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}