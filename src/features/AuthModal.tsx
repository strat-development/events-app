"use client";

import { Auth } from "@supabase/auth-ui-react";
import { Modal } from "./Modal";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { useModal } from "@/hooks/useModal";
import { LogIn } from "lucide-react";

export const AuthModal = () => {
    const supabaseClient = createClientComponentClient<Database>();
    const router = useRouter();
    const { session } = useSessionContext();
    const { onClose, isOpen, showSignUp } = useModal();

    const onChange = (open: boolean) => {
        if (!open) {
            onClose();
        }
    };

    useEffect(() => {
        if (session) {
            onClose();
            const createProfil = async () => {
                const { error, status } = await supabaseClient
                    .from("users")
                    .upsert({
                        email: session.user.email ?? '',
                        id: session.user.id ?? ''
                    });

                if (error && status !== 406) {
                    console.log(error);
                }
            };
            createProfil();
        }
    }, [session, router, onClose]);

    const customTheme = {
        ...ThemeSupa,
        default: {
            colors: {
                brand: '#3b82f6',
                brandAccent: '#3b82f6',
                brandButtonText: 'white',
                defaultButtonBackground: 'white',
                defaultButtonBackgroundHover: '#131414',
                defaultButtonBorder: 'lightgray',
                defaultButtonText: 'gray',
                dividerBackground: '#131414',
                inputBackground: 'transparent',
                inputBorder: 'lightgray',
                inputBorderHover: 'gray',
                inputBorderFocus: 'gray',
                inputText: 'black',
                inputLabelText: 'gray',
                inputPlaceholder: 'darkgray',
                messageText: 'gray',
                messageTextDanger: 'red',
                anchorTextColor: 'gray',
                anchorTextHoverColor: 'darkgray',
            },
            space: {
                spaceSmall: '4px',
                spaceMedium: '8px',
                spaceLarge: '16px',
                labelBottomMargin: '8px',
                anchorBottomMargin: '4px',
                emailInputSpacing: '4px',
                socialAuthSpacing: '4px',
                buttonPadding: '10px 15px',
                inputPadding: '10px 15px',
            },
            fontSizes: {
                baseBodySize: '13px',
                baseInputSize: '14px',
                baseLabelSize: '14px',
                baseButtonSize: '14px',
            },
            fonts: {
                bodyFontFamily: `ui-sans-serif, sans-serif`,
                buttonFontFamily: `ui-sans-serif, sans-serif`,
                inputFontFamily: `ui-sans-serif, sans-serif`,
                labelFontFamily: `ui-sans-serif, sans-serif`,
            },
            // fontWeights: {},
            // lineHeights: {},
            // letterSpacings: {},
            // sizes: {},
            borderWidths: {
                buttonBorderWidth: '1px',
                inputBorderWidth: '1px',
            },
            // borderStyles: {},
            radii: {
                borderRadiusButton: '16px',
                buttonBorderRadius: '16px',
                inputBorderRadius: '16px',
            },
        },
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                onChange={onChange}>
                <div className="flex flex-col items-start gap-4 justify-center text-white/70">
                    <div className="p-4 text-white/70 bg-white/10 rounded-full w-fit">
                        <LogIn size={32} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-bold">Welcome to Huddle.</h1>
                        <p className="text-white/50">Please sign in or sign up to continue.</p>
                    </div>
                </div>
                <Auth
                    theme="dark"
                    magicLink={false}
                    providers={[]}
                    view={showSignUp ? "sign_up" : "sign_in"}
                    supabaseClient={supabaseClient}
                    appearance={{
                        theme: customTheme,
                    }}
                />
            </Modal>
        </>
    );
};