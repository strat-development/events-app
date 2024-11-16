"use client"

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/providers/UserContextProvider";

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
        <div className="flex flex-col items-center gap-8 min-[1200px]:my-24">
            <div className="flex flex-col gap-2 items-center">
                <h1 className="text-2xl font-semibold tracking-wider text-center min-[1200px]:text-5xl">
                    Welcome back, <br /> 
                    <span className="opacity-80 text-3xl font-bold min-[1200px]:text-6xl" 
                    style={{
                        background: 'linear-gradient(90deg, #CA73FF, #3FA3FF, #6FF6FF)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>{userName}</span>! 👋
                </h1>
                <p className="text-lg text-muted-foreground min-[1200px]:text-xl">Find events in your area</p>
            </div>

            <div className="flex max-[1024px]:items-center">
                <div className="flex">
                    <Input className="rounded-r-none h-[48px] text-lg truncate"
                        id="search"
                        type="text"
                        placeholder="Search for a business or service"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="w-[180px]">
                        <Input className="rounded-none h-[48px] text-lg"
                            id="city"
                            type="text"
                            placeholder="City"
                            value={isCity}
                            onChange={(e) => setIsCity(e.target.value)}
                        />
                    </div>
                </div>
                <Button className="rounded-l-none h-[48px] text-lg"
                    onClick={handleSearch}>Search</Button>
            </div>
        </div>
    );
};