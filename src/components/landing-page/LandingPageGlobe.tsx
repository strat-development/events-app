import { globeConfig, sampleArcs } from "@/data/globe-data";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import "../../styles/landing-page.css"
import React from "react";

const World = dynamic(() => import("../../components/ui/globe").then((m) => m.World), {
    ssr: false,
});


export const LandingPageGlobe = React.memo(() => {
    return (
        <>
            <div className="max-w-[1200px] mx-auto w-full relative h-full">
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
                    <h2 className="text-center absolute -top-[7.5%] left-1/2 transform -translate-x-1/2 tracking-wider text-2xl min-[900px]:text-4xl font-medium text-[#545454] w-fit">
                        Our goal is to connect <br />
                        <span className="max-[440px]:text-8xl text-9xl min-[900px]:text-[256px] bg-gradient-to-br from-white to-black/20 bg-clip-text text-transparent font-bold text-glare">
                            10,000
                        </span>
                    </h2>
                    <h2 className="w-full absolute text-center top-[25%] min-[900px]:top-[30%] text-2xl text-white/70 left-1/2 transform -translate-x-1/2 z-[9999]">
                        <span className="max-[440px]:text-3xl text-4xl min-[900px]:text-[64px] font-bold uppercase">
                            users worldwide
                        </span>  <br />
                        <span className="text-white/50">
                            by the end of 2025
                        </span>
                    </h2>
                </motion.div>
                <div className="w-full bottom-0 inset-x-0 bg-gradient-to-b pointer-events-none select-none bg-transparent z-40" />
                <div className="w-full -bottom-20 max-[900px]:h-[600px] h-[900px] z-10 opacity-90">
                    <World data={sampleArcs} globeConfig={globeConfig} />
                </div>
            </div>
        </>
    )
})