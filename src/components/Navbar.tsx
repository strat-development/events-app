"use client"

import {
    IonNav
} from "@ionic/react";
import { NavComponent } from "./NavComponent";

export const Navbar = () => {
    return (
        <IonNav className="fixed h-[80px] z-[222222222]" root={() => <NavComponent />} />
    )
}