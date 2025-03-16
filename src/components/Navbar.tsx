"use client"

import {
    IonNav
} from "@ionic/react";
import { NavComponent } from "./NavComponent";

export const Navbar = () => {
    return (
        <IonNav className="fixed top-0 left-0 right-0 z-[99999999999999999] h-fit max-w-[1200px] w-full justify-self-center" root={() => <NavComponent />} />
    )
}