"use client"

import {
    IonNav
} from "@ionic/react";
import { NavComponent } from "./NavComponent";

export const Navbar = () => {
    return (
        <IonNav className="fixed h-fit z-[99999999] max-w-[1200px] w-full justify-self-center" root={() => <NavComponent />} />
    )
}