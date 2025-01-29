"use client"

import GridLoader from "react-spinners/GridLoader";

export default function Loading() {
    return (
        <>
            <div className="h-screen w-full flex items-center justify-center">
                <GridLoader className="opacity-50" color="#fff" size={24} margin={2} />
            </div>
        </>
    )
}