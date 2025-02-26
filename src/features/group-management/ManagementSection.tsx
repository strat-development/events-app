"use client"

import { Input } from "@/components/ui/input"
import { GroupManagementTable } from "./GroupManagementTable"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EventsManagementTable } from "./EventsManagementsTable";

export const ManagementSection = () => {
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [tableMode, setTableMode] = useState<boolean | null>(true);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    return (
        <div className="max-w-[1200px] w-full pl-4 min-[900px]:pl-16 flex flex-col gap-8 max-[768px]:flex-wrap">
            <div className="flex justify-between gap-8">
                <Input className="max-w-[180px] placeholder:text-white/50"
                    id="search-input"
                    type="text"
                    placeholder="Search interests"
                    value={searchQuery}
                    onChange={handleSearchChange}
                />

                <div className="flex gap-4">
                    <Button className={tableMode === true ? "border-b-[1px] border-white/70 text-white rounded-none hover:bg-transparent" : "text-white/50 hover:bg-transparent"}
                        variant="ghost"
                        onClick={() => {
                            setTableMode(true);
                        }}>
                        Groups Table
                    </Button>
                    <Button className={tableMode === false ? "border-b-[1px] border-white/70 text-white rounded-none hover:bg-transparent" : "text-white/50 hover:bg-transparent"}
                        variant="ghost"
                        onClick={() => {
                            setTableMode(false);
                        }}>
                        Events Table
                    </Button>
                </div>

            </div>

            {tableMode === true && (
                <GroupManagementTable searchQuery={searchQuery} />
            ) || (
                    <EventsManagementTable searchQuery={searchQuery} />
                )}
        </div>
    )
}