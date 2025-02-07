"use client"

import { useMutation, useQueryClient } from 'react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { useUserContext } from '@/providers/UserContextProvider';
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Trash } from 'lucide-react';
import { supabaseAdmin } from '@/lib/admin';

export const DeleteUserProfileImageDialog = () => {
    const supabase = createClientComponentClient<Database>();
    const queryClient = useQueryClient();
    const { userId } = useUserContext();
    const [isOpen, setIsOpen] = useState(false);

    const deleteProfilePicture = useMutation(
        async () => {
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

            const { error: updateError } = await supabase
                .from('profile-pictures')
                .update({ image_url: "" })
                .eq('user_id', userId);

            if (updateError) {
                throw updateError;
            }
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['users']);
                setIsOpen(false);
                toast({
                    title: "Success",
                    description: "Profile picture deleted successfully",
                });
            },
            onError: (error) => {
                console.error('Error deleting profile picture:', error);
                toast({
                    title: "Error",
                    description: "Error deleting profile picture",
                });
            }
        }
    );

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger className='absolute top-4 right-4' 
                asChild>
                    <Trash className="text-red-500 cursor-pointer" />
                </DialogTrigger>
                <DialogContent className="max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete picture</DialogTitle>
                        <DialogDescription className="text-white/70">
                            Are you sure you want to delete your profile picture? If not please close this dialog.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="destructive"
                        onClick={() => deleteProfilePicture.mutate()}>Delete Picture</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};