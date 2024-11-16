import { AuthModal } from "@/features/AuthModal";
import { useModal } from "@/hooks/useModal";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSessionContext } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

export const NavComponent = () => {
    const authModal = useModal();
    const session = useSessionContext();
    const supabase = createClientComponentClient<Database>();
    const router = useRouter();

    return (
        <nav className="flex z-[999999999999999] justify-between items-center p-3 backdrop-blur-lg bg-[#090a0a/20] rounded-lg text-white border border-wihte/10 my-4">
            <div className="flex items-center">
                <Link href="/"
                    className="text-2xl font-bold ml-4">Logo</Link>
            </div>

            {!session.session?.user.role === true && (
                <div className="flex flex-gap-2">
                    <button onClick={() => {
                        authModal.onOpen();
                    }}>
                        Login
                    </button>
                    <button onClick={() => {
                        authModal.onOpen();
                    }}>
                        Register
                    </button>
                </div>
            ) || (
                    <div className="flex gap-2 items-center">
                        <Button variant={"ghost"}
                            onClick={() => {
                                router.push("/dashboard");
                            }}>
                            Dashboard
                        </Button>
                        <Button variant={"outline"} 
                        onClick={(
                            async () => {
                                await supabase.auth.signOut();

                                router.push("/");
                            }
                        )}>
                            Logout
                        </Button>

                    </div>
                )}
            <AuthModal />
        </nav>
    )
}