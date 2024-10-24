"use client"

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EventSearchComponentProps {
    city: string | null;
}

export const EventSearchComponent = ({ city }: EventSearchComponentProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCity, setIsCity] = useState(city || '');
    const router = useRouter();

    const handleSearch = () => {
        if (searchTerm.trim()) {
            router.push(`/events-page?search=${encodeURIComponent(searchTerm)}&city=${encodeURIComponent(isCity)}`);
        }
    };

    return (
        <div>
            <div className="flex gap-4 max-[1024px]:items-center">
                <div className="flex">
                    <Input className="rounded-r-none"
                        id="search"
                        type="text"
                        placeholder="Search for a business or service"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="w-[180px]">
                        <Input className="rounded-l-none"
                            id="city"
                            type="text"
                            placeholder="City"
                            value={isCity}
                            onChange={(e) => setIsCity(e.target.value)}
                        />
                    </div>
                </div>
                <Button onClick={handleSearch}>Search</Button>
            </div>
        </div>
    );
};