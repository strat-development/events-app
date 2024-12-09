import { Github, Instagram } from "lucide-react"
import Link from "next/link"
import { ContactDialog } from "./ContactDialog"
import { IonFooter } from "@ionic/react"
import Image from "next/image"

export const Footer = () => {
    return (
        <>
            <IonFooter>
                <footer className="footer px-4 mt-24 flex justify-between gap-8 flex-wrap bg-base-200 text-base-content mb-4 max-w-[1200px] justify-self-center w-full">
                    <nav className="flex flex-col gap-2">
                        <h6 className="text-lg font-bold">Services</h6>
                        <Link className="text-white/70"
                            href="/">Branding</Link>
                        <Link className="text-white/70"
                            href="/">Design</Link>
                        <Link className="text-white/70"
                            href="/">Marketing</Link>
                        <Link className="text-white/70"
                            href="/">Advertisement</Link>
                    </nav>
                    <nav className="flex flex-col gap-2">
                        <h6 className="text-lg font-bold">Company</h6>
                        <Link className="text-white/70"
                            href="/">About us</Link>
                        <ContactDialog />
                        <Link className="text-white/70"
                            href="/">Jobs</Link>
                        <Link className="text-white/70"
                            href="/">Press kit</Link>
                    </nav>
                    <nav className="flex flex-col gap-2">
                        <h6 className="text-lg font-bold">Legal</h6>
                        <Link className="text-white/70"
                            href="/">Terms of use</Link>
                        <Link className="text-white/70"
                            href="/">Privacy policy</Link>
                        <Link className="text-white/70"
                            href="/">Cookie policy</Link>
                    </nav>
                </footer>
                <footer className="footer bg-base-200 text-base-content border-base-300 border-t flex gap-4 justify-between flex-wrap border-white/10 p-4 max-w-[1200px] justify-self-center w-full">
                    <aside className="flex flex-col gap-2">
                        <Image src="/Huddle-logo.svg" alt="Huddle." width={84} height={84} />
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
                            <Link className="text-white/70"
                                href="/">
                                <Instagram strokeWidth={1} />
                            </Link>
                            <Link className="text-white/70"
                                href="/">
                                <Github strokeWidth={1} />
                            </Link>
                        </div>
                    </nav>
                </footer>
            </IonFooter>
        </>
    )
}