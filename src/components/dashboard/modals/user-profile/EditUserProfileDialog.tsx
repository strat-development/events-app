import { Button } from "@/components/ui/button"
import { DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { useUserContext } from "@/providers/UserContextProvider"
import { Database } from "@/types/supabase"
import { UserData } from "@/types/types"
import { Dialog } from "@radix-ui/react-dialog"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState } from "react"
import { useMutation, useQueryClient } from "react-query"

export const EditUserProfileDialog = () => {
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();
    const { userId, setUserEmail, setUserName } = useUserContext();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const addUserData = useMutation(
        async (newUserData: UserData[]) => {
            await supabase
                .from("users")
                .upsert(newUserData)
                .eq("id", userId);
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(["users", userId]);
                toast({
                    title: "Success",
                    description: "Profile edited successfully",
                });
            },
            onError: () => {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "There was an error editing your profile",
                });
            },
        }
    );

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button className="w-fit">Edit user</Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px]">
                    <Input
                        className="mt-8"
                        id="fullName"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                    />
                    <Input
                        id="email"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                        id="city"
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                    />
                    <Input
                        id="country"
                        placeholder="Country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                    />

                    <DialogFooter>
                        {fullName && email && city && country && (
                            <HoverBorderGradient
                                onClick={() => {
                                    if (!fullName || !email || !city || !country) {
                                        toast({
                                            variant: "destructive",
                                            title: "Error",
                                            description: "Please fill out all fields",
                                        });
                                        return;
                                    } else {
                                        addUserData.mutateAsync(
                                            [
                                                {
                                                    full_name: fullName,
                                                    email: email,
                                                    city: city,
                                                    country: country,
                                                    user_role: "User",
                                                    id: userId,
                                                },
                                            ] as UserData[],
                                            {
                                                onSuccess: () => {
                                                    queryClient.invalidateQueries(["users", userId]);
                                                    setIsOpen(false);

                                                    setUserEmail(email);
                                                    setUserName(fullName);
                                                },
                                            }
                                        );
                                    }
                                }}>
                                Edit Profile
                            </HoverBorderGradient>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};