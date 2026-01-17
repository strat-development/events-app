"use client"

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/providers/UserContextProvider";
import { Search } from "lucide-react";

interface EventSearchComponentProps {
    city: string | null;
}

export const EventSearchComponent = ({ city }: EventSearchComponentProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCity, setIsCity] = useState(city || '');
    const router = useRouter();
    const { userName } = useUserContext();

    const handleSearch = () => {
        if (searchTerm.trim()) {
            router.push(`/events-page?search=${encodeURIComponent(searchTerm)}&city=${encodeURIComponent(isCity)}`);
        }
    };

    return (
        <>
            <div className="flex flex-col items-center gap-8 my-12">
                <div className="text-center">
                    <h1 className="text-4xl lg:text-6xl font-bold tracking-wider mb-2">
                        Welcome back,
                    </h1>
                    <h2 className="text-5xl lg:text-7xl font-extrabold tracking-wider"
                        style={{
                            background: 'linear-gradient(90deg, #CA73FF, #3FA3FF, #6FF6FF)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        {userName}!
                    </h2>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-2 shadow-xl flex items-center gap-2 w-full max-w-2xl">
                    <Input 
                        className="bg-transparent border-none h-12 text-lg placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
                        id="search"
                        type="text"
                        placeholder="Search for events"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <div className="hidden sm:block w-px h-8 bg-white/10" />
                    <Input 
                        className="bg-transparent border-none h-12 text-lg placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0 w-32 sm:w-40"
                        id="city"
                        type="text"
                        placeholder="City"
                        value={isCity}
                        onChange={(e) => setIsCity(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button 
                        className="h-12 px-6  transition-all duration-300"
                        onClick={handleSearch}
                    >
                        <Search strokeWidth={2} size={20} />
                    </Button>
                </div>
            </div>
        </>
    );
};