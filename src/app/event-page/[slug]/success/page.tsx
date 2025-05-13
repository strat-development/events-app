"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export default function PaymentSuccessPage({
    params,
}: {
    params: { eventId: string };
}) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const supabase = createClientComponentClient<Database>();
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        const verifyPaymentAndAddTicket = async () => {
            if (!sessionId) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Invalid payment session",
                });
                router.push(`/dashboard/tickets`);
                return;
            }

            try {
                const verificationResponse = await fetch('/api/stripe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ sessionId }),
                });

                if (!verificationResponse.ok) {
                    const errorData = await verificationResponse.json();
                    if (errorData.error === 'Ticket already exists for this user and event') {
                        toast({
                            title: "Ticket Already Exists",
                            description: "You already have a ticket for this event",
                        });
                        router.push(`/home`);
                        return;
                    }
                    throw new Error(errorData.error || 'Payment verification failed');
                }

                const { eventId, userId } = await verificationResponse.json();

                const { error } = await supabase
                    .from('event-tickets')
                    .insert({
                        event_id: eventId,
                        user_id: userId,
                    });

                if (error) throw error;

                toast({
                    title: "Success!",
                    description: "Your ticket has been created",
                });

                router.push(`/dashboard/tickets`);
            } catch (error) {
                console.error('Payment verification error:', error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to verify payment and create ticket",
                });
                router.push(`/home`);
            }
        };

        verifyPaymentAndAddTicket();
    }, [sessionId, params.eventId, router, supabase]);

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Processing your payment...</h1>
                <p>Please wait while we verify your payment and create your ticket.</p>
            </div>
        </div>
    );
}