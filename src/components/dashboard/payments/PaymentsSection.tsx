"use client";

import { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useQuery } from "react-query";
import { useUserContext } from "@/providers/UserContextProvider";
import { useSearchParams } from "next/navigation";
import { IconBrandStripeFilled } from "@tabler/icons-react";
import { RevenueSection } from "./RevenueSection";
import { UnlinkAccountDialog } from "../modals/payments/UnlinkAccountDialog";
import { RefundSection } from "./RefundsSection";
import { ReceiptsSection } from "./ReceiptsSection";

type StripeAccountLinkResponse = {
    url?: string;
    error?: string;
    success?: boolean;
}

export const PaymentsSection = () => {
    const supabase = createClientComponentClient<Database>();
    const { userId } = useUserContext();
    const [accountCreatePending, setAccountCreatePending] = useState(false);
    const [accountLinkCreatePending, setAccountLinkCreatePending] = useState(false);
    const [error, setError] = useState(false);
    const [stripeError, setStripeError] = useState<string | null>(null);
    const [connectedAccountId, setConnectedAccountId] = useState("");
    const [isActiveUser, setIsActiveUser] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        const success = searchParams.get('success');
        const userId = searchParams.get('userId');
        const refresh = searchParams.get('refresh');

        if (success && userId) {
            const checkOnboarding = async () => {
                try {
                    const { data, error } = await supabase
                        .from('stripe-users')
                        .select('*')
                        .eq('user_id', userId)
                        .single();

                    if (error) throw error;

                    if (data?.is_active) {
                        setIsActiveUser(true);
                    } else if (data?.stripe_user_id) {
                        const account = await fetch('/api/verify-stripe-webhook', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                accountId: data.stripe_user_id,
                                userId: userId,
                                account: data.stripe_user_id
                            })
                        }).then(res => res.json());

                        if (account.details_submitted) {
                            alert('Onboarding complete! Please wait a moment for verification...');
                        }
                    }
                } catch (err) {
                    console.error('Onboarding check failed:', err);
                }
            };

            checkOnboarding();
        }

        if (refresh && userId) {
            const handleRefresh = async () => {
                try {
                    await fetch('/api/verify-stripe-webhook', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ account: connectedAccountId })
                    }).then(res => res.json());
                } catch (err) {
                    console.error('Refresh failed:', err);
                }
            };

            handleRefresh();
        }
    }, [searchParams, supabase]);

    const { data: stripeUserId } = useQuery(
        ["stripe-user-id", userId],
        async () => {
            const { data, error } = await supabase
                .from("stripe-users")
                .select("*")
                .eq("user_id", userId)

            if (error) {
                console.error("Error fetching Stripe user ID:", error.message);
                return null;
            }

            if (data) {
                setConnectedAccountId(data[0]?.stripe_user_id);
                setIsActiveUser(data[0]?.is_active || false);
            }

            return data[0]?.stripe_user_id;
        },
        {
            enabled: !!userId,
        }
    );

    return (
        <>
            <div className="grid grid-cols-2 gap-4 justify-center w-full h-full p-4 rounded-lg shadow-md">
                <div className="col-span-1 flex flex-col gap-4 p-4 bg-[#1a1a1a] rounded-lg shadow-md">
                    <div className="flex flex-col justify-between h-full gap-2">
                        {!isActiveUser && (
                            <div className="flex flex-col gap-2">
                                <h1 className="text-2xl font-bold">Start selling tickets</h1>
                                <p className="mb-4 text-white/70">Connect your Stripe account to start selling tickets</p>
                            </div>
                        )}
                        <div className="flex gap-4 items-start">
                            <div className="p-2 rounded-full bg-[#635fff] w-fit">
                                <IconBrandStripeFilled size={28} />
                            </div>
                            <div>
                                <p className="font-medium tracking-wide">Stripe account</p>
                                {isActiveUser && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-200"></div><p className="text-sm text-green-200">Active</p>
                                    </div>
                                )}
                                {!isActiveUser && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-300"></div><p className="text-sm text-orange-300">Waiting for activation.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-sm text-white/70">
                            <hr className="my-4 border-white/10" />
                            If you want to use different Stripe account, <UnlinkAccountDialog />
                        </div>
                    </div>

                    {!accountCreatePending && !connectedAccountId && !stripeUserId && (
                        <Button className="bg-[#635fff] hover:bg-[#635fff]/80 text-white"
                            onClick={async () => {
                                setAccountCreatePending(true);
                                setError(false);
                                fetch("/api/create-stripe-account", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ userId })
                                })
                                    .then((response) => response.json())
                                    .then((json) => {
                                        setAccountCreatePending(false);
                                        if (json.accountId) {
                                            setConnectedAccountId(json.accountId);
                                        } else if (json.error) {
                                            setError(true);
                                        }
                                    });
                            }}>
                            Create STRIPE ACCOUNT
                        </Button>
                    )}

                    {connectedAccountId && !accountLinkCreatePending && isActiveUser === false && (
                        <Button
                            onClick={async () => {
                                if (!connectedAccountId) return;

                                setAccountLinkCreatePending(true);
                                setStripeError(null);

                                try {
                                    const response = await fetch("/api/create-stripe-account-link", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            accountId: connectedAccountId,
                                            userId: userId
                                        }),
                                    });

                                    const data: StripeAccountLinkResponse = await response.json();

                                    if (!response.ok || !data.url) {
                                        throw new Error(data.error || 'Failed to create account link');
                                    }

                                    window.location.href = data.url;
                                } catch (err) {
                                    console.error("Account link creation failed:", err);
                                    setStripeError((err instanceof Error ? err.message : 'An error occurred while creating the account link.'));
                                } finally {
                                    setAccountLinkCreatePending(false);
                                }
                            }}
                            disabled={accountLinkCreatePending}
                        >
                            Add information
                        </Button>
                    )}

                    {error && <p className="error">Something went wrong!</p>}
                    {(connectedAccountId || accountCreatePending || accountLinkCreatePending) && (
                        <div className="dev-callout">
                            {accountCreatePending && <p>Creating a connected account...</p>}
                            {accountLinkCreatePending && <p>Creating a new Account Link...</p>}
                        </div>
                    )}
                </div>
                <RevenueSection connectedAccountId={connectedAccountId}
                    isActiveUser={isActiveUser} />
                <RefundSection />
                {/* <ReceiptsSection sellerAccountId={connectedAccountId} /> */}
            </div>
        </>
    );
}