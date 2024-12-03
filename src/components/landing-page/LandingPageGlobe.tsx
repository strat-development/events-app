import { globeConfig, sampleArcs } from "@/data/globe-data";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const World = dynamic(() => import("../../components/ui/globe").then((m) => m.World), {
    ssr: false,
});


export const LandingPageGlobe = () => {
    return (
        <>
            <div className="flex flex-row relative items-center justify-center min-h-screen md:h-auto w-full">
                <div className="max-w-[1200px] mx-auto w-full relative h-full md:h-[40rem] px-4">
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 20,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        transition={{
                            duration: 1,
                        }}
                        className="div">
                        <h2 className="text-center tracking-wider text-xl md:text-4xl font-bold text-white w-fit justify-self-center">
                            Our goal is to reach <br />
                            <span className="text-black bg-metallic-gradient text-shadow-white rounded-lg shadow-metallic px-4 py-2 inline-block">
                                10,000
                            </span> <br />
                            users by the end of 2025
                        </h2>

                        <p className="text-center text-base md:text-lg font-normal text-neutral-700 dark:text-neutral-200 max-w-md mt-2 mx-auto">
                            This globe is interactive and customizable. Have fun with it, and
                            don&apos;t forget to share it. :)
                        </p>
                    </motion.div>
                    <div className="w-full bottom-0 inset-x-0 bg-gradient-to-b pointer-events-none select-none bg-transparent z-40" />
                    <div className="w-full -bottom-20 max-[900px]:h-96 h-full z-10">
                        <World data={sampleArcs} globeConfig={globeConfig} />
                    </div>
                </div>
            </div>
        </>
    )
}