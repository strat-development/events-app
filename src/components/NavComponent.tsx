import { AuthModal } from "@/features/AuthModal";
import { useModal } from "@/hooks/useModal";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSessionContext } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { IconMenuDeep } from "@tabler/icons-react";
import { useState } from "react";
import { Github, Instagram } from "lucide-react";
import Image from "next/image";
import { HoverBorderGradient } from "./ui/hover-border-gradient";

export const NavComponent = () => {
    const authModal = useModal();
    const session = useSessionContext();
    const supabase = createClientComponentClient<Database>();
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);

    return (
        <nav className={`flex z-[999999999] justify-between items-start px-4 py-2 backdrop-blur-lg bg-[#090a0a/20] rounded-2xl text-white/85 border border-wihte/10 max-[1200px]:m-4 my-4 transition-all duration-100 ${expanded ? 'h-fit flex-col backdrop-blur-2xl' : ''}`}>
            <div className="flex w-full justify-between items-center">
                <Link href={!session.session?.user.role === true ? "/" : "/home"}>
                    <Image className="max-[480px]:hidden min-[480px]:w-24"
                        src="/Huddle-logo.svg" alt="Huddle." width={84} height={84} />
                    <Image className="min-[480px]:hidden w-6"
                        src="/Huddle-minimalistic-logo.svg" alt="Huddle." width={84} height={84} />
                </Link>
                <div className="flex gap-8 max-[768px]:hidden items-center">
                    <Link className=" text-white/70"
                        href="/change-log">
                        Change log
                    </Link>
                    <Link className="max-[768px]:hidden text-white/70"
                        href="/about">
                        About
                    </Link>
                </div>

                {!session.session?.user.role === true && (
                    <div className="flex gap-4 items-center">
                        <div className="flex gap-4">
                            <Button className="text-white/70 rounded-lg"
                                variant="ghost"
                                onClick={() => {
                                    authModal.onOpen(false);
                                }}>
                                Login
                            </Button>
                            <HoverBorderGradient className="font-medium tracking-wide"
                                onClick={() => {
                                    authModal.onOpen(true);
                                }}>
                                Register
                            </HoverBorderGradient>
                        </div>

                        <IconMenuDeep className="min-[768px]:hidden"
                            onClick={() => {
                                setExpanded(!expanded);
                            }}
                            strokeWidth={1} />
                    </div>
                ) || (
                        <div className="flex gap-2 items-center">
                            <HoverBorderGradient className="font-medium tracking-wide"
                                onClick={() => {
                                    router.push("/dashboard");
                                }}>
                                Dashboard
                            </HoverBorderGradient>
                            <Button className="bg-transparent rounded-lg text-white/70"
                                variant="ghost"
                                onClick={(
                                    async () => {
                                        await supabase.auth.signOut();

                                        router.push("/");
                                    }
                                )}>
                                Logout
                            </Button>
                            <IconMenuDeep className="min-[768px]:hidden"
                                onClick={() => {
                                    setExpanded(!expanded);
                                }}
                                strokeWidth={1} />
                        </div>
                    )}
            </div>

            {expanded == true && (
                <div className="flex flex-col gap-8 justify-between p-2 relative mt-4">
                    <div className="flex flex-col gap-4 min-[768px]:hidden">
                        <Link className="text-xl font-medium text-white/50"
                            onClick={() => {
                                setExpanded(!expanded);
                            }}
                            href="/change-log">
                            Change log
                        </Link>
                        <Link className="min-[768px]:hidden text-xl font-medium text-white/50"
                            onClick={() => {
                                setExpanded(!expanded);
                            }}
                            href="/about">
                            About
                        </Link>
                    </div>

                    <div className="flex gap-8 text-white/50">
                        <Link href="https://github.com/ddebixx"
                            onClick={() => {
                                setExpanded(!expanded);
                            }}>
                            <Github size={20} strokeWidth={1} />
                        </Link>
                        <Link href="https://www.instagram.com/debix.cr2/"
                            onClick={() => {
                                setExpanded(!expanded);
                            }}>
                            <Instagram size={20} strokeWidth={1} />
                        </Link>
                    </div>
                </div>
            )}

            <AuthModal />
        </nav>
    )
}