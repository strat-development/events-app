import { AboutSection } from "@/components/landing-page/AboutSection";
import { LandingPageGrid } from "@/components/landing-page/LandingPageGrid";

export default function AboutPage() {
    return (
        <>
            <div className="max-w-[1200px] w-full justify-self-center flex flex-col">
                <LandingPageGrid />
                <AboutSection />
            </div>
        </>
    )
}