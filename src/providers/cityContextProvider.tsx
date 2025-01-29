import { createContext, useContext, useEffect, useState } from "react";

type CityContextType = {
    city: string;
    setCity: (city: string) => void;
};

export const CityContext = createContext<CityContextType | null>(null);

export default function CityContextProvider({ children }: { children: React.ReactNode }) {
    const [city, setCity] = useState<string>("");
    const geoKey = process.env.NEXT_PUBLIC_GEO_CODE_API_KEY;

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;

                const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${geoKey}&language=en`);
                const data = await response.json();
                const city = data.results[0].components.city;

                setCity(city);
            }, (error) => {
                console.error("Error occurred while getting geolocation: ", error);
            });
        } else {
            console.log("Geolocation is not supported by this browser.");
        }
    }, []);

    return (
        <CityContext.Provider value={{ city, setCity }}>
            {children}
        </CityContext.Provider>
    );
}

export function useCityContext() {
    const context = useContext(CityContext);
    if (!context) {
        throw new Error("useCityContext must be used within a CityContextProvider");
    }
    return context;
}