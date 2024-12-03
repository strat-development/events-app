"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useGroupDataContext } from "@/providers/GroupDataModalProvider"

export const GroupTopicsModalStep = () => {
    const [searchQuery, setSearchQuery] = useState<string>("")
    const { interestsData, selectedGroup, selectedInterests, setSelectedInterests, setSelectedGroup } = useGroupDataContext()

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

    return (
        <div>
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
                                        <Button id={`interest-${index}`}
                                            key={interest.name}
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
                        <h2 className="text-xl tracking-wider font-semibold">Selected Interests</h2>
                        <div className="flex gap-2">
                            {selectedInterests.map((interest) => (
                                <Button
                                    key={interest}
                                    className="px-4 py-2 border bg-blue-500 text-white"
                                    onClick={() => handleInterestClick(interest)}>
                                    {interest}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}