"use client"

import "./globals.css";
import { SupabaseProvider } from "@/providers/SupabaseProvider";
import { Navbar } from "@/components/Navbar";
import { QueryClient, QueryClientProvider } from "react-query";
import UserContextProvider from "@/providers/UserContextProvider";
import GroupDataModalProvider from "@/providers/GroupDataModalProvider";
import GroupOwnerContextProvider from "@/providers/GroupOwnerProvider";
import CityContextProvider from "@/providers/cityContextProvider";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import ViewContextProvider from "@/providers/pageViewProvider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const Footer = dynamic(() => import('@/components/Footer').then(mod => mod.Footer), { ssr: false });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = new QueryClient();
  const pathname = usePathname();
  const isHomePage = pathname === "/";

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
                    <ViewContextProvider>
                      <Navbar />
                        {children}
                      <Footer />
                    </ViewContextProvider>
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
