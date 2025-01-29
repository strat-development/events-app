import Image from "next/image"
import { BackgroundGradient } from "../ui/background-gradient"

export const LandingPagePhoneCard = () => {
    return (
        <>
            <div className="min-h-screen flex items-center pt-36">
                <BackgroundGradient className="rounded-[22px] max-w-sm p-4 sm:p-10 bg-zinc-900">
                    <Image
                        src={`/jordans.webp`}
                        alt="jordans"
                        height="400"
                        width="400"
                        className="object-contain"
                    />
                </BackgroundGradient>
            </div>
        </>
    )
}