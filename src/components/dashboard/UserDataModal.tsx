"use state"

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useUserContext } from "@/providers/UserContextProvider";
import { toast } from "../ui/use-toast";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { UserData } from "@/types/types";

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

interface UserInterestsData {
    user_interests: string[]
    id: string
}

export const UserDataModal = () => {
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();
    const { userRole, userId } = useUserContext();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [tabValue, setTabValue] = useState("user-data");
    const [interestsData, setInterestsData] = useState<InterestData | null>(null)
    const [selectedInterests, setSelectedInterests] = useState<string[]>([])
    const [selectedGroup, setSelectedGroup] = useState<string | null>("all")
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [userInterests, setUserInterests] = useState<string[]>([])

    const addUserData = useMutation(
        async (newUserData: UserData[]) => {
            await supabase
                .from("users")
                .upsert(newUserData)
                .eq("id", userId);
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['users']);
                toast({
                    title: "Success",
                    description: "User created successfully",
                });

            },

            onError: () => {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "There was an error creating the user"
                });
            }
        }
    );

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

    const addInterests = useMutation(async (userData: UserInterestsData) => {
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


    return (
        <>
            <Tabs defaultValue={tabValue}
                className="w-[400px]">
                <TabsList className="flex w-full">
                    {!userRole && (
                        <TabsTrigger className="w-full"
                            value="user-data">User data</TabsTrigger>
                    )}
                    {!userInterests && (
                        <TabsTrigger className="w-full"
                            value="user-interests">Interests</TabsTrigger>
                    )}
                </TabsList>
                {!userRole && (
                <TabsContent value="user-data">
                    <Input
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                    <Input
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                    <Input
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                    />
                    <Input
                        placeholder="Country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                    />
                    <Button onClick={() => {
                        if (!firstName || !lastName || !email || !city || !country) {
                            toast({
                                variant: "destructive",
                                title: "Error",
                                description: "Please fill out all fields"
                            });
                            return;
                        } else {
                            addUserData.mutateAsync([{
                                first_name: firstName,
                                last_name: lastName,
                                email: email,
                                city: city,
                                country: country,
                                user_role: "User",
                                id: userId
                            }] as UserData[]);

                            setTabValue("user-interests");
                        }
                    }}>Create User</Button>
                </TabsContent>
                )}
                {!userInterests && (
                    <TabsContent value="user-interests">
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
                                .map((group) => (
                                    <div key={group["group-name"]} className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            {group.interests
                                                .filter((interest) => !selectedInterests.includes(interest.name))
                                                .filter((interest) => interest.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                                .map((interest) => (
                                                    <Button
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
                                    <h2 className="text-xl font-semibold">Selected Interests</h2>
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
                        <Button onClick={
                            () => {
                                if (userId) {
                                    addInterests.mutateAsync({
                                        user_interests: selectedInterests,
                                        id: userId
                                    } as UserInterestsData, {
                                        onSuccess: () => {
                                            window.location.reload()
                                        }
                                    })
                                }
                            }
                        }>
                            Save Interests
                        </Button>
                    </TabsContent>
                )}
            </Tabs>
        </>
    )
}