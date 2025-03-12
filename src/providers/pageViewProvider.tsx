import { createContext, useContext, useState } from "react";

type ViewContextType = {
    view: string;
    setView: (view: string) => void;
}

export const ViewContext = createContext<ViewContextType | null>(null);

export default function ViewContextProvider({ children }: { children: React.ReactNode }) {
    const [view, setView] = useState<string>("about")

    return (
        <ViewContext.Provider value={{ view, setView }}>
            {children}
        </ViewContext.Provider>
    );
}

export function useViewContext() {
    const context = useContext(ViewContext);

    if (!context) {
        throw new Error("useViewContext must be used within a ViewContextProvider");
    }

    return context
}