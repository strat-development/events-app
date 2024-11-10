import { AuthModal } from "@/features/AuthModal";
import { useModal } from "@/hooks/useModal";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSessionContext } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const NavComponent = () => {
    const authModal = useModal();
    const session = useSessionContext();
    const supabase = createClientComponentClient<Database>();
    const router = useRouter();

    return (
        <nav className="flex justify-between items-center h-[80px] w-full bg-gray-900 text-white">
            <div className="flex items-center">
                <Link href="/"
                    className="text-2xl font-bold ml-4">Logo</Link>
            </div>

            {!session.session?.user.role === true && (
                <div>
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
                    <div className="flex gap-4">
                        <Link href="/dashboard">
                            <button>Dashboard</button>
                        </Link>
                        <button onClick={(
                            async () => {
                                await supabase.auth.signOut();

                                router.push("/");
                            }
                        )}>
                            Logout
                        </button>
                    </div>
                )}
            <AuthModal />
        </nav>
    )
}