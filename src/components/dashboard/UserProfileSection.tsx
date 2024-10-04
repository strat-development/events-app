"use client"

import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Toaster } from "../ui/toaster";
import { UserDataModal } from "./UserDataModal";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { UserData } from "@/types/types";
import { toast } from "../ui/use-toast";
import { Modal } from "@/features/Modal";
import { supabaseAdmin } from "@/lib/admin";
import Image from "next/image";



export const UserProfileSection = () => {
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();
    const { userRole, userId } = useUserContext();
    const [firstName, setFirstName] = useState("");
    const [email, setEmail] = useState("");
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imageUrls, setImageUrls] = useState<{ publicUrl: string }[]>([]);

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
                    description: "Profile edited successfully",
                });

            },

            onError: () => {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "There was an error editing your profile"
                });
            }
        }
    );

    const addProfilePicture = useMutation(
        async (paths: string[]) => {
            const results = await Promise.all(paths.map(async (path) => {
                const { data, error } = await supabase
                    .from('profile-pictures')
                    .upsert({
                        user_id: userId,
                        image_url: path
                    });
                if (error) {
                    throw error;
                }
                return data;
            }));

            return results;
        },
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
            enabled: !!userId
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

    const editProfileModalContent = (
        <>
            <Input
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
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
            <div className="flex gap-4">
                <Input type="file"
                    onChange={(e) => {
                        if (e.target.files) {
                            setFiles([...files, ...Array.from(e.target.files)]);
                        }
                    }} />
                {files.length > 0 && (
                    <Button variant={"destructive"}
                        onClick={() => setFiles([])}>
                        Clear
                    </Button>
                )}
            </div>

            <Button onClick={() => {
                if (!firstName || !email || !city || !country) {
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Please fill out all fields"
                    });
                    return;
                } else {
                    addUserData.mutateAsync([{
                        full_name: firstName,
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

                    if (files.length > 0) {
                        uploadFiles(files)
                            .then((paths) => {
                                return addProfilePicture.mutateAsync(paths);
                            })
                            .catch((error) => console.error('Error uploading files:', error));
                    } else {
                        toast({
                            title: "Error",
                            description: "Error uploading image",
                        });
                    }
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
                        <Image src={imageUrls[0]?.publicUrl || "/profile-placeholder.png"} alt="profile picture" width={200} height={200} />
                        <h2>{user.full_name}</h2>
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
                    onClose={() => { }}
                    onChange={setIsModalOpen}
                />
            )}

            <Toaster />
        </>
    )
}

