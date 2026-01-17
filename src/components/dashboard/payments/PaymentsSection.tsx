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
            <div className="flex flex-col gap-6 w-full">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h1 className="text-3xl font-bold tracking-wider bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                        Payments & Revenue
                    </h1>
                    <p className="text-white/60 mt-2">Manage your Stripe account and track your earnings</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
                        {!isActiveUser && (
                            <div className="flex flex-col gap-2">
                                <h2 className="text-2xl font-bold text-white/90">Start Selling Tickets</h2>
                                <p className="text-white/60">Connect your Stripe account to start selling tickets</p>
                            </div>
                        )}
                        
                        <div className="flex gap-4 items-start">
                            <div className="p-3 rounded-xl bg-[#635fff] shadow-lg">
                                <IconBrandStripeFilled size={32} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="font-semibold text-lg text-white/90">Stripe Account</p>
                                {isActiveUser ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                        <p className="text-sm text-green-400 font-medium">Active</p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                                        <p className="text-sm text-orange-400 font-medium">Waiting for activation</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {!accountCreatePending && !connectedAccountId && !stripeUserId && (
                            <Button 
                                className="bg-[#635fff] hover:bg-[#635fff]/80 text-white transition-all duration-300 shadow-lg hover:shadow-xl"
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
                                }}
                            >
                                Create Stripe Account
                            </Button>
                        )}

                        {connectedAccountId && !accountLinkCreatePending && isActiveUser === false && (
                            <Button
                                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
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
                                Complete Account Setup
                            </Button>
                        )}

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                <p className="text-red-400 text-sm">Something went wrong! Please try again.</p>
                            </div>
                        )}
                        
                        {(accountCreatePending || accountLinkCreatePending) && (
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                {accountCreatePending && <p className="text-blue-400 text-sm">Creating your Stripe account...</p>}
                                {accountLinkCreatePending && <p className="text-blue-400 text-sm">Preparing account setup...</p>}
                            </div>
                        )}

                        <div className="pt-4 border-t border-white/10">
                            <p className="text-sm text-white/50">
                                Need to use a different account? <UnlinkAccountDialog />
                            </p>
                        </div>
                    </div>

                    <RevenueSection connectedAccountId={connectedAccountId} isActiveUser={isActiveUser} />
                </div>

                <RefundSection />
            </div>
        </>
    );
}