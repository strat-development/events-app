"use client"

import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Toaster } from "../ui/toaster";
import { UserDataModal } from "./UserDataModal";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { UserData } from "@/types/types";
import { toast } from "../ui/use-toast";
import { Modal } from "@/features/Modal";



export const UserProfileSection = () => {
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();
    const { userRole, userId } = useUserContext();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const editProfileModalContent = (
        <>
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
                    }] as UserData[], {
                        onSuccess: () => {
                            queryClient.invalidateQueries(['users']);

                            setIsModalOpen(false);
                        }
                    });
                }
            }}>Edit Profile</Button>
        </>
    )

    const bodyContent = (
        <>
            <UserDataModal />
        </>
    )

    const getUserData = useQuery(
        ['users'],
        async () => {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", userId)

            if (error) {
                throw error;
            }

            return data;
        },
        {
            enabled: !!userId
        }
    )

    return (
        <>
            <div>
                {getUserData.data?.map((user) => (
                    <div key={user.id}>
                        <h2>{user.first_name} {user.last_name}</h2>
                        <p>{user.email}</p>
                        <p>{user.city}, {user.country}</p>
                    </div>
                ))}
                {getUserData.isLoading && <div>Loading...</div>}
            </div>

            <Button onClick={() => { setIsModalOpen(true) }}>Edit Profile</Button>

            <Modal title="Edit your profile"
                body={editProfileModalContent}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onChange={setIsModalOpen}
            />

            {!userRole && (
                <Modal title="User Data"
                    body={bodyContent}
                    isOpen={true}
                    onClose={() => {}}
                    onChange={setIsModalOpen}
                />
            )}

            <Toaster />
        </>
    )
}

