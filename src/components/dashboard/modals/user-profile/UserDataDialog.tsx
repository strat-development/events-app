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
import { FileUpload } from "@/components/ui/file-upload";
import { supabaseAdmin } from "@/lib/admin";
import { Building2 } from "lucide-react";

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
    const [interestsData, setInterestsData] = useState<InterestData | null>(null)
    const [selectedInterests, setSelectedInterests] = useState<string[]>([])
    const [selectedGroup, setSelectedGroup] = useState<string | null>("all")
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [userInterests, setUserInterests] = useState<string[]>([])
    const [displayedInterests, setDisplayedInterests] = useState<Interest[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [imageUrls, setImageUrls] = useState<{ publicUrl: string }[]>([]);
    const [emailError, setEmailError] = useState<string | null>(null);

    const validateEmail = (email: string): boolean => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };



    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const emailValue = e.target.value;
        setEmail(emailValue);

        if (!validateEmail(emailValue)) {
            setEmailError("Please enter a valid email address.");
        } else {
            setEmailError(null);
        }
    };

    const handleBlur = () => {
        if (!validateEmail(email)) {
            setEmailError("Please enter a valid email address.");
        } else {
            setEmailError(null);
        }
    };

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

    const addProfilePicture = useMutation(
        async (paths: string[]) => {
          const { data: currentData } = await supabase
            .from('profile-pictures')
            .select('image_url')
            .eq('user_id', userId)
            .single();
      
          if (currentData?.image_url) {
            await supabaseAdmin.storage
              .from('profile-pictures')
              .remove([currentData.image_url]);
          }
      
          const { data, error } = await supabase
            .from('profile-pictures')
            .upsert({
              user_id: userId,
              image_url: paths[0]
            })
            .eq('user_id', userId);
      
          if (error) throw error;
          return data;
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries(['profile-pictures', userId]);
            toast({
              title: "Success",
              description: "Profile picture updated!"
            });
          },
          onError: (error) => {
            toast({
              variant: "destructive",
              title: "Error"
            });
          }
        }
      );

    const uploadFiles = async (files: File[]) => {
        const uploadPromises = files.map((file) => {
            const path = `${file.name}${Math.random()}.${file.name.split('.').pop()}`;
            return { promise: supabaseAdmin.storage.from('profile-pictures').upload(path, file), path };
        });

        const responses = await Promise.all(uploadPromises.map(({ promise }) => promise));

        responses.forEach((response, index) => {
            if (response.error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: `Error uploading file ${files[index].name}`
                })
            } else {
                toast({
                    title: "Success",
                    description: `File ${files[index].name} uploaded successfully`
                })
            }
        });

        return uploadPromises.map(({ path }) => path);
    }

    const { data: images, isLoading } = useQuery(
        ['profile-pictures', userId],
        async () => {
            const { data, error } = await supabase
                .from('profile-pictures')
                .select('*')
                .eq('user_id', userId)
            if (error) {
                throw error;
            }
            return data || [];
        },
        {
            enabled: !!userId,
            cacheTime: 10 * 60 * 1000,
        }
    );

    useEffect(() => {
        if (images) {
            Promise.all(images.map(async (image) => {
                const { data: publicURL } = await supabase.storage
                    .from('profile-pictures')
                    .getPublicUrl(image.image_url)

                return { publicUrl: publicURL.publicUrl };

            }))
                .then((publicUrls) => setImageUrls(publicUrls))
                .catch(console.error);
        }
    }, [images]);

    const handleSubmit = () => {
        if (!validateEmail(email)) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please enter a valid email address.",
            });
            return;
        }

        if (!fullName || !email || !city || !country) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please fill out all fields",
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

            if (userId) {
                addInterests.mutateAsync({
                    user_interests: selectedInterests,
                    id: userId
                } as UserInterestsData, {
                    onSuccess: () => {
                        queryClient.invalidateQueries("userInterests");
                        queryClient.invalidateQueries("users");
                    }
                });
            }

            if (files.length > 0) {
                uploadFiles(files)
                    .then((paths) => {
                        return addProfilePicture.mutateAsync(paths), {
                            onSuccess: () => {
                                toast({
                                    title: "Success",
                                    description: "Image updated successfully",
                                });

                                queryClient.invalidateQueries(['profile-pictures', userId]);

                            },
                            onError: () => {
                                toast({
                                    title: "Error",
                                    description: "Error updating image",
                                    variant: "destructive",
                                });
                            }
                        }
                    })
                    .catch((error) => console.error('Error uploading files:', error));
            }
        }
    };

    return (
        <>
            <Dialog open={!userInterests && !userRole}>
                <DialogContent className="flex w-full max-w-[100vw] h-screen rounded-none bg-transparent">
                    <div className="relative flex flex-row max-[900px]:flex-col max-[900px]:items-center items-start max-h-[80vh] overflow-y-auto justify-center w-full gap-16 mt-24">
                        <FileUpload
                            onChange={(selectedFiles) => {
                                setFiles(selectedFiles);
                            }}
                        />
                        <div className="flex flex-col gap-4 max-w-[480px]">
                            <div className="flex flex-col gap-2 items-start justify-center">
                                <Input className="p-0 placeholder:text-white/60 bg-transparent border-none text-2xl outline-none"
                                    id="fullName"
                                    placeholder="Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                                <Input
                                    className="p-0 placeholder:text-white/60 bg-transparent border-none text-2xl outline-none"
                                    id="email"
                                    placeholder="Email"
                                    type="email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    onBlur={handleBlur}
                                />
                                {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
                                <div className="flex max-[900px]:flex-col gap-4">
                                    <Input className="p-0 placeholder:text-white/60 bg-transparent border-none text-2xl outline-none"
                                        id="city"
                                        placeholder="City"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                    />

                                    <Input className="p-0 placeholder:text-white/60 bg-transparent border-none text-2xl outline-none"
                                        id="country"
                                        placeholder="Country"
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                    />
                                </div>
                            </div>


                            <div className="flex flex-col">
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
                                    <div className="flex flex-wrap gap-4 overflow-y-auto">
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
                            </div>
                            {fullName && email && city && country && selectedInterests.length > 0 && userId && (
                                <HoverBorderGradient 
                                onClick={handleSubmit}>Create User</HoverBorderGradient>
                            )}
                        </div>
                    </div>
                </DialogContent >
            </Dialog >

            <Toaster />
        </>
    )
}