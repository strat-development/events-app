"use client"

import "./globals.css";
import { SupabaseProvider } from "@/providers/SupabaseProvider";
import { Navbar } from "@/components/Navbar";
import { QueryClient, QueryClientProvider } from "react-query";
import UserContextProvider from "@/providers/UserContextProvider";
import GroupDataModalProvider from "@/providers/GroupDataModalProvider";
import GroupOwnerContextProvider from "@/providers/GroupOwnerProvider";
import CityContextProvider from "@/providers/cityContextProvider";
import { Footer } from "@/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  const queryClient = new QueryClient();
  const isHomePage = window.location.pathname === "/";

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/Huddle-minimalistic-logo.svg" />
      </head>
      <body className={`${!isHomePage ? "px-4" : ""}`}>
        <SupabaseProvider>
          <QueryClientProvider client={queryClient}>
            <UserContextProvider>
              <GroupDataModalProvider>
                <GroupOwnerContextProvider>
                  <CityContextProvider>
                    <Navbar />
                    {children}
                    <Footer />
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
