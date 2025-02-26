"use client"

import { Auth } from "@supabase/auth-ui-react";
import { Modal } from "./Modal"
import { useSessionContext } from "@supabase/auth-helpers-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { useModal } from "@/hooks/useModal";

export const AuthModal = () => {
    const supabaseClient = createClientComponentClient<Database>()
    const router = useRouter()
    const { session } = useSessionContext();
    const { onClose, isOpen, showSignUp } = useModal();

    const onChange = (open: boolean) => {
        if (!open) {
            onClose();
        }
    }

    useEffect(() => {
        if (session) {
            onClose();
            const createProfil = async () => {
                const { error, status } = await supabaseClient
                    .from("users")
                    .upsert(
                        {
                            email: session.user.email ?? '',
                            id: session.user.id ?? ''
                        },
                    )

                if (error && status !== 406) {
                    console.log(error)
                }
            };
            createProfil();
        }
    }, [session, router, onClose])

    return (
        <>
            <Modal
                title="Welcome back!"
                isOpen={isOpen}
                onClose={onClose}
                onChange={onChange}>
                <Auth
                    theme="dark"
                    magicLink={false}
                    providers={[]}
                    view={showSignUp ? "sign_up" : "sign_in"}
                    supabaseClient={supabaseClient}
                    appearance={{
                        theme: ThemeSupa,
                        variables: {
                            default: {
                                colors: {
                                    brand: 'hsl(255 60.0% 53.0%)',
                                    brandAccent: 'hsl(255 54.8% 45.1%)',
                                },
                            },
                        },
                    }}
                />
            </Modal>
        </>
    )
}