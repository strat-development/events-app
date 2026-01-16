"use client";

import { LandingPageGrid } from "@/components/landing-page/LandingPageGrid";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { FlipWords } from "@/components/ui/flip-words";
import "../app/globals.css";
import "../styles/landing-page.css";
import Image from "next/image";
import { AboutSection } from "@/components/landing-page/AboutSection";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { motion } from "framer-motion";

export default function Home() {
  const session = useSessionContext();
  const router = useRouter();
  const words = ["Huddle.", "Create.", "Network.", "Learn."];

  const [gridRef, isGridVisible] = useIntersectionObserver({ threshold: 0.1 }, 300);
  const [aboutRef, isAboutVisible] = useIntersectionObserver({ threshold: 0.1 }, 300);

  if (!session.session?.user.role === false) {
    router.push("/home");
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 200 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <main className="flex w-full justify-self-center min-h-screen flex-col items-center justify-between no-padding">
      <div className="w-full">
        <AuroraBackground className="overflow-hidden">
          <div className="relative max-w-[1200px] w-full mx-auto">
            <div className="flex flex-col gap-4 items-start max-w-[1200px] px-4 w-full max-[900px]:z-[9999] max-[900px]:mb-36">
              <h1 className="text-5xl min-[900px]:text-7xl font-bold text-center tracking-widest text-white">
                <FlipWords words={words} />
              </h1>
              <p className="text-base min-[900px]:text-xl z-[999] text-white/50 tracking-wider w-[70%] min-[900px]:w-[35%]">
                We are all about networking, improvement and inspiration.
              </p>
            </div>
            <div
              className="left-[20%] top-[60%] absolute min-[900px]:left-[60%] transform min-[900px]:top-[30%] -translate-y-1/2 opacity-0 animate-slideInFromTop delay-200 z-20 max-[900px]:w-[700px] w-[100%] h-auto"
              style={{ animationDelay: "500ms" }}
            >
              <Image
                src="/Home-screen.png"
                alt="Huddle."
                width={2000}
                height={2000}
              />
            </div>

            <div
              className="absolute left-0 top-[85%] min-[900px]:left-[45%] transform -translate-x-1/2 min-[900px]:top-1/2 -translate-y-1/2 opacity-0 animate-slideInFromTopWithOpacity z-10 max-[900px]:w-[700px] w-[100%] h-auto"
            >
              <Image
                src="/User-dashboard.png"
                alt="Huddle."
                width={2000}
                height={2000}
              />
            </div>
            {/* <div className="absolute left-0 top-[85%] min-[900px]:left-[45%] transform -translate-x-1/2 min-[900px]:top-1/2 -translate-y-1/2 opacity-0 animate-slideInFromTopWithOpacity z-10 max-[900px]:w-[700px] w-[100%] h-auto">
              <Image
                src="/landing-images/hero_image.png"
                alt="Huddle."
                width={800}
                height={800}
                className="object-contain"
              />
            </div> */}
          </div>
        </AuroraBackground>
      </div>

      <div ref={gridRef} style={{ minHeight: "500px" }}>
        {isGridVisible && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <LandingPageGrid />
          </motion.div>
        )}
      </div>

      <div ref={aboutRef} style={{ minHeight: "500px" }}>
        {isAboutVisible && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <AboutSection />
          </motion.div>
        )}
      </div>
    </main>
  );
}