import { Button } from "@/components/ui/button"
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { supabaseAdmin } from "@/lib/admin"
import { useUserContext } from "@/providers/UserContextProvider"
import { Database } from "@/types/supabase"
import { UserData } from "@/types/types"
import { Dialog } from "@radix-ui/react-dialog"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"

export const EditUserProfileDialog = () => {
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();
    const { userId } = useUserContext();
    const [firstName, setFirstName] = useState("");
    const [email, setEmail] = useState("");
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [isOpen, setIsOpen] = useState(false);
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
            const { data: currentData, error: currentError } = await supabase
                .from('profile-pictures')
                .select('image_url')
                .eq('user_id', userId)
                .single();
    
            if (currentError) {
                throw currentError;
            }
    
            if (currentData && currentData.image_url) {
                const { error: deleteError } = await supabaseAdmin
                    .storage
                    .from('profile-pictures')
                    .remove([currentData.image_url]);
    
                if (deleteError) {
                    throw deleteError;
                }
            }
    
            const results = await Promise.all(paths.map(async (path) => {
                const { data, error } = await supabase
                    .from('profile-pictures')
                    .update({
                        user_id: userId,
                        image_url: path
                    })
                    .eq('user_id', userId);
    
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

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button>Edit user</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit user</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to edit user profile? If not please close this dialog.
                        </DialogDescription>
                    </DialogHeader>
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


                    <DialogFooter>
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

                                        setIsOpen(false);
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
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}