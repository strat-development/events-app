import { Github, Instagram } from "lucide-react"
import Link from "next/link"
import { ContactDialog } from "./dashboard/modals/contact/ContactDialog"
import { IonFooter } from "@ionic/react"
import Image from "next/image"

export const Footer = () => {
    return (
        <>
            <IonFooter>
                <footer className="footer px-4 mt-24 flex justify-between items-start gap-8 flex-wrap bg-base-200 text-base-content mb-4 max-w-[1200px] justify-self-center w-full">
                    <Image className="hover:opacity-50 transition duration-300"
                        src="/Huddle-logo.svg" alt="Huddle." width={84} height={84} />
                    <nav className="flex flex-col gap-2">
                        <h6 className="text-lg text-white/70 font-bold">Project</h6>
                        <Link className="text-white/50"
                            href="/about">Features</Link>
                        <Link className="text-white/50"
                            href="/about">About</Link>
                        <Link className="text-white/50"
                            href="/change-log">Changelog</Link>
                        <Link className="text-white/50"
                            href="/terms-of-use">Terms of Use</Link>
                    </nav>
                    <nav className="flex flex-col gap-2">
                        <h6 className="text-lg text-white/70 font-bold">Connect</h6>
                        <Link className="text-white/50"
                            href="https://www.instagram.com/debix.cr2/">Instagram</Link>
                        <ContactDialog />
                        <Link className="text-white/50"
                            href="https://github.com/ddebixx">GitHub</Link>
                        <Link className="text-white/50"
                            href="https://debix.vercel.app">Portfolio</Link>
                    </nav>
                </footer>
                <footer className="footer bg-base-200 text-base-content border-base-300 border-t flex gap-4 justify-between flex-wrap border-white/10 p-4 max-w-[1200px] justify-self-center w-full">
                    <aside className="flex flex-col gap-2">
                        <p className="text-white/30 text-sm">
                            strat.dev
                            <br />
                            Created with love by <span style={{
                                background: 'linear-gradient(90deg, #CA73FF, #3FA3FF, #6FF6FF)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>ddebixx</span>
                        </p>
                    </aside>
                    <nav className="md:place-self-center md:justify-self-end">
                        <div className="grid grid-flow-col gap-4">
                            <Link className="text-white/50"
                                href="/https://www.instagram.com/debix.cr2/">
                                <Instagram strokeWidth={1} />
                            </Link>
                            <Link className="text-white/50"
                                href="/https://github.com/ddebixx">
                                <Github strokeWidth={1} />
                            </Link>
                        </div>
                    </nav>
                </footer>
            </IonFooter>
        </>
    )
}