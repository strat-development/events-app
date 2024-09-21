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
    const router = useRouter();

    const handleSearch = () => {
        if (searchTerm.trim()) {
            router.push(`/events-page?search=${encodeURIComponent(searchTerm)}`);
        }
    };

    return (
        <div>
            <div className="flex gap-4 max-[1024px]:items-center">
                <Input
                    id="search"
                    type="text"
                    placeholder="Search for a business or service"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button onClick={handleSearch}>Search</Button>
            </div>
        </div>
    );
};