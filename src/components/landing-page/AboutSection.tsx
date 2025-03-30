"use client"

import Image from "next/image"
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card"
import { actions } from "@/data/hero-data"
import React from "react"
import { motion } from "framer-motion";

export const AboutSection = React.memo(() => {
    function classNames(...classes: (string | boolean)[]): string {
        return classes.filter(Boolean).join(' ')
    }

    return (
        <>
            <motion.div className="max-w-[1200px] w-full px-4 mb-24 flex flex-col items-center justify-center gap-8 max-[900px]:mb-48 min-[768px]:h-screen">
                <div className="flex justify-evenly items-center max-w-[1200px] w-full flex-wrap gap-4">
                    {actions.map((action) => (
                        <Card className="max-w-[360px] h-full relative border-none bg-transparent cursor-pointer hover:bg-white/3 hover:ring-2 hover:ring-white/10 rounded-lg transition-all duration-300">
                            <CardContent key={action.title}
                                className={classNames(
                                    'group relative flex flex-col gap-4 p-6',
                                )}>
                                {action.image_url && <Image src={action.image_url} alt="" width={2000} height={2000} className="aspect-square" />}

                                <CardTitle className="flex flex-col gap-2 text-white/70">
                                    {action.title}
                                </CardTitle>
                                <CardDescription className="text-sm text-white/50 hover:pl-2 transition-all duration-300">
                                    {action.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </motion.div>
        </>
    )
})