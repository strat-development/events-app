import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { WorldMap } from "../ui/world-map";
import "../../styles/landing-page.css";
import GridLoader from "react-spinners/GridLoader";
import { Dots } from "@/data/map-data";

export const LandingPageMap = React.memo(() => {
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsMapLoaded(true);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            {!isMapLoaded && (
                <div className="h-screen w-full flex items-center justify-center">
                    <GridLoader className="opacity-50" color="#fff" size={24} margin={2} />
                </div>
            ) || (
                    <motion.div className="relative py-40 w-full">
                        <div className="max-w-7xl mx-auto text-center">
                            <h2 className="text-center absolute -top-[7.5%] left-1/2 transform -translate-x-1/2 tracking-wider text-2xl min-[900px]:text-4xl font-medium text-[#545454] w-fit">
                                Our goal is to connect <br />
                                <span className="max-[440px]:text-8xl text-8xl min-[900px]:text-[256px] bg-gradient-to-br from-white to-[#4A4A4A] bg-clip-text text-transparent font-bold text-glare">
                                    10,000
                                </span>
                            </h2>
                            <h2 className="w-full absolute text-center top-[25%] min-[900px]:top-[30%] text-2xl text-[#B5B5B5] left-1/2 transform -translate-x-1/2 z-[9999]">
                                <span className="max-[440px]:text-3xl text-3xl min-[900px]:text-[64px] font-bold uppercase">
                                    users worldwide
                                </span>{" "}
                                <br />
                            </h2>
                        </div>

                        <WorldMap
                            dots={Dots}
                        />

                    </motion.div>
                )}
        </>
    );
});