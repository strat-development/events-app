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
        <div className="flex flex-col items-center gap-8 min-[900px]:gap-6 min-[1200px]:my-8">
                <h1 className="text-3xl font-semibold tracking-wider text-center min-[1200px]:text-5xl">
                    Welcome back, <br />
                    <span className="opacity-80 text-4xl font-bold min-[1200px]:text-6xl"
                        style={{
                            background: 'linear-gradient(90deg, #CA73FF, #3FA3FF, #6FF6FF)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>{userName}</span>!
                </h1>

            <div className="flex max-[1024px]:items-center">
                <div className="flex">
                    <Input className="rounded-r-none h-[48px] text-lg truncate placeholder:text-white/50"
                        id="search"
                        type="text"
                        placeholder="Search for events"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="w-[180px]">
                        <Input className="rounded-none h-[48px] text-lg placeholder:text-white/50"
                            id="city"
                            type="text"
                            placeholder="City"
                            value={isCity}
                            onChange={(e) => setIsCity(e.target.value)}
                        />
                    </div>
                </div>
                <Button className="rounded-l-none h-[48px] text-lg"
                    onClick={handleSearch}>
                        <Search strokeWidth={1} 
                        size={24} />
                    </Button>
            </div>
        </div>
    );
};