"use client"

import { useSessionContext } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const session = useSessionContext()
  const router = useRouter()

  if (session) {
    router.push("/home")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">

    </main>
  );
}
