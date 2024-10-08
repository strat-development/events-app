"use client"

import { Inter } from "next/font/google";
import "./globals.css";
import { SupabaseProvider } from "@/providers/SupabaseProvider";
import { Navbar } from "@/components/Navbar";
import { QueryClient, QueryClientProvider } from "react-query";
import UserContextProvider from "@/providers/UserContextProvider";
import GroupDataModalProvider from "@/providers/GroupDataModalProvider";
import GroupOwnerContextProvider, { GroupOwnerContext } from "@/providers/GroupOwnerProvider";
import CityContextProvider from "@/providers/cityContextProvider";


const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const queryClient = new QueryClient();

  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          <QueryClientProvider client={queryClient}>
            <UserContextProvider>
              <GroupDataModalProvider>
                <GroupOwnerContextProvider>
                  <CityContextProvider>
                    <Navbar />
                    {children}
                  </CityContextProvider>
                </GroupOwnerContextProvider>
              </GroupDataModalProvider>
            </UserContextProvider>
          </QueryClientProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
