"use state"

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/tabs"
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useUserContext } from "@/providers/UserContextProvider";
import { toast } from "../../../ui/use-toast";
import { Input } from "../../../ui/input";
import { Button } from "../../../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select";
import { UserData } from "@/types/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/toaster";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { useRouter } from "next/navigation";

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
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [tabValue, setTabValue] = useState("user-data");
    const [interestsData, setInterestsData] = useState<InterestData | null>(null)
    const [selectedInterests, setSelectedInterests] = useState<string[]>([])
    const [selectedGroup, setSelectedGroup] = useState<string | null>("all")
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [userInterests, setUserInterests] = useState<string[]>([])
    const [displayedInterests, setDisplayedInterests] = useState<Interest[]>([]);

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
    },
        {
            cacheTime: 10 * 60 * 1000,
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
        ["users"]
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
        cacheTime: 10 * 60 * 1000,
    })

    const shuffleInterests = () => {
        if (!interestsData) return;

        const allInterests = interestsData["interest-groups"]
            .filter((group) => selectedGroup === "all" || group["group-name"] === selectedGroup)
            .flatMap((group) => group.interests)
            .filter((interest) => !selectedInterests.includes(interest.name))
            .filter((interest) => interest.name.toLowerCase().includes(searchQuery.toLowerCase()));

        const shuffledInterests = allInterests.sort(() => 0.5 - Math.random()).slice(0, 15);
        setDisplayedInterests(shuffledInterests);
    };

    useEffect(() => {
        shuffleInterests();
    }, [interestsData, selectedGroup, searchQuery]);

    return (
        <>
            <Dialog open={!userInterests && !userRole}>
                <DialogContent className="max-w-[480px] flex flex-col items-center p-8">
                    <Tabs onValueChange={tabValue => setTabValue(tabValue)} value={tabValue}
                        className="max-w-[480px] w-full">
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
                            <TabsContent className="flex flex-col gap-4"
                                value="user-data">
                                <Input id="fullName"
                                    placeholder="Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                                <Input id="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Input id="city"
                                    placeholder="City"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                />
                                <Input id="country"
                                    placeholder="Country"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                />
                                <Button id="nextBtn"
                                    onClick={() => setTabValue("user-interests")}>
                                    Next
                                </Button>
                            </TabsContent>
                        )}

                        {!userInterests && (
                            <TabsContent className="flex flex-col gap-4"
                                value="user-interests">
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
                                    <div className="flex flex-wrap gap-4 max-h-[124px] overflow-y-auto">
                                        {displayedInterests.map((interest) => (
                                            <Button
                                                key={interest.name}
                                                className="px-4 py-2 border bg-white text-black"
                                                onClick={() => handleInterestClick(interest.name)}>
                                                {interest.name}
                                            </Button>
                                        ))}
                                    </div>

                                    <Button variant="ghost"
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

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setTabValue("user-data")
                                    }}>
                                    Back
                                </Button>
                            </TabsContent>
                        )}
                    </Tabs>

                    {fullName && email && city && country && selectedInterests.length > 0 && userId && (
                        <HoverBorderGradient onClick={() => {
                            if (!fullName || !email || !city || !country) {
                                toast({
                                    variant: "destructive",
                                    title: "Error",
                                    description: "Please fill out all fields"
                                });
                                return;
                            } else {
                                addUserData.mutateAsync([{
                                    full_name: fullName,
                                    email: email,
                                    city: city,
                                    country: country,
                                    user_role: "User",
                                    id: userId
                                }] as UserData[]);

                                {
                                    if (userId) {
                                        addInterests.mutateAsync({
                                            user_interests: selectedInterests,
                                            id: userId
                                        } as UserInterestsData, {
                                            onSuccess: () => {
                                                queryClient.invalidateQueries("userInterests");
                                                queryClient.invalidateQueries("users");
                                            }
                                        })
                                    }
                                }

                                setTabValue("user-interests");
                            }
                        }}>Create User</HoverBorderGradient>
                    )}
                </DialogContent>
            </Dialog >

            <Toaster />
        </>
    )
}