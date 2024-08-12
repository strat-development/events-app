"use client"

import React from "react"
import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/supabase"
import { SessionContextProvider } from "@supabase/auth-helpers-react"

interface SupabaseProviderProps {
    children: React.ReactNode
};

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ 
    children 
}) => {
    const [supabaseClient] = useState(() => 
        createClientComponentClient<Database>()
    )

    return(
        <SessionContextProvider supabaseClient={supabaseClient}>
            {children}
        </SessionContextProvider>
    )
}