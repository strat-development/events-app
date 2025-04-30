"use client"

import { useEffect, useState } from "react";
import { useUserContext } from "@/providers/UserContextProvider";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/dashboard/Navbar";
import { PaymentsSection } from "@/components/dashboard/payments/PaymentsSection";

export default function Refresh() {
  const [accountLinkCreatePending, setAccountLinkCreatePending] = useState(false);
  const params = useParams();
  const connectedAccountId = params.slug;
  const { userId, loading } = useUserContext();
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!loading && userId === null) {
      router.push('/');
    }
  }, [loading, userId, router]);

  useEffect(() => {
    if (connectedAccountId) {
      setAccountLinkCreatePending(true);
      fetch("/api/create-stripe-account-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account: connectedAccountId,
        }),
      })
        .then((response) => response.json())
        .then((json) => {
          setAccountLinkCreatePending(false);

          const { url, error } = json;

          if (url) {
            window.location.href = url;
          }

          if (error) {
            setError(true);
          }
        });
    }
  }, [connectedAccountId])

  return (
    <div className="flex justify-between items-start pt-24 max-w-[1200px] w-full justify-self-center">
      <Navbar />
      {userId.length > 0 && (
        <div className="justify-self-center overflow-x-hidden w-full">
          <PaymentsSection />
        </div>
      )}
    </div>
  );
}