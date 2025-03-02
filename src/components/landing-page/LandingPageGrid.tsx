"use client"

import { items } from "@/data/hero-data";
import { BentoGrid, BentoGridItem } from "../ui/bento-grid"
import React from "react";
import { motion } from "framer-motion";

export const LandingPageGrid = React.memo(() => {
    return (
        <motion.div className="py-24 max-w-[1200px] w-full max-[1200px]:px-4">
            <BentoGrid>
                {items.map((item, i) => (
                    <BentoGridItem
                        key={i}
                        icon={item.icon as any}
                        title={item.title}
                        description={item.description}
                        header={item.header}
                        imagePath={item.imagePath}
                        className={i === 3 || i === 6 ? "md:col-span-2" : ""}
                    />
                ))}
            </BentoGrid>
        </motion.div>
    );
})