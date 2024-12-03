"use client"

import { LandingPageGrid } from "@/components/landing-page/LandingPageGrid";
import { LandingPageGlobe } from "@/components/landing-page/LandingPageGlobe";
import { LandingPagePhoneCard } from "@/components/landing-page/LandingPagePhoneCard";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { FlipWords } from "@/components/ui/flip-words";
import "../app/globals.css";


export default function Home() {
  const session = useSessionContext()
  const router = useRouter()
  const words = ["Huddle.", "Create.", "Network.", "Learn."]

  if (!session.session?.user.role === false) {
    router.push("/home")
  }

  return (
    <main className="flex w-full justify-self-center min-h-screen flex-col items-center justify-between no-padding">
      <div className="w-full">
        <AuroraBackground>
          <div className="flex flex-col gap-4 items-start max-w-[1200px] w-full justify-self-center">
            <h1 className="text-7xl font-bold text-center tracking-widest text-white"><FlipWords words={words} /> </h1>
            <p className="text-xl text-white/50 tracking-wider w-[70%]">We are all about networking, improvement and inspiration.</p>
          </div>
        </AuroraBackground>
      </div>
      <LandingPageGrid />
      <LandingPageGlobe />
      <LandingPagePhoneCard />
    </main>
  );
}
