"use client"

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { useModal } from "@/hooks/useModal";
import { Modal } from "./Modal";
import { Input } from "@/components/ui/input";


export const AuthModal = () => {
    const supabaseClient = createClientComponentClient<Database>()
    const { onClose, isOpen } = useModal();
    const onChange = (open: boolean) => {
        if (!open) {
            onClose()
        }
    }

    return (
        <Modal
            title="Welcome back!"
            isOpen={isOpen}
            onClose={onClose}>
            <Auth
                theme="dark"
                magicLink={false}
                providers={[]}
                supabaseClient={supabaseClient}
                appearance={{
                    theme: ThemeSupa,
                    variables: {
                        default: {
                            colors: {
                                brand: '#854FF3',
                                brandAccent: "#8e5cf1",
                                inputText: "#FF",
                            }
                        }
                    }
                }}
            />
        </Modal>
    )
}