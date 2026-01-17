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
        <>
            <div className="max-w-[1400px] w-full min-h-[80vh] flex flex-col gap-6">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold tracking-wider bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                Management
                            </h1>
                            <p className="text-white/60 text-sm">Manage your groups and events</p>
                        </div>
                        
                        <Input 
                            className="max-w-[240px] bg-white/5 border-white/10 focus:border-white/30 placeholder:text-white/50 transition-all"
                            id="search-input"
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                    </div>

                    <div className="flex gap-2 mt-6 p-1 bg-white/5 rounded-xl w-fit">
                        <Button 
                            className={tableMode === true 
                                ? "bg-white/10 text-white hover:bg-white/15 transition-all duration-300" 
                                : "text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300"
                            }
                            variant="ghost"
                            onClick={() => setTableMode(true)}
                        >
                            Groups Table
                        </Button>
                        <Button 
                            className={tableMode === false 
                                ? "bg-white/10 text-white hover:bg-white/15 transition-all duration-300" 
                                : "text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300"
                            }
                            variant="ghost"
                            onClick={() => setTableMode(false)}
                        >
                            Events Table
                        </Button>
                    </div>
                </div>

                {tableMode === true ? (
                    <GroupManagementTable searchQuery={searchQuery} />
                ) : (
                    <EventsManagementTable searchQuery={searchQuery} />
                )}
            </div>
        </>
    )
}