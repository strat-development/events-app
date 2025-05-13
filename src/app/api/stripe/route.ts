import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-util';
import { supabaseAdmin } from '@/lib/admin';

export async function POST(request: Request) {
    try {
        const { sessionId } = await request.json();

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['payment_intent', 'line_items'],
        });

        if (session.payment_status !== 'paid') {
            return NextResponse.json(
                { error: 'Payment not completed' },
                { status: 402 }
            );
        }

        const userId = session.metadata?.user_id;
        const eventId = session.metadata?.event_id;

        if (!userId || !eventId) {
            return NextResponse.json(
                { error: 'Missing user or event information in session metadata' },
                { status: 400 }
            );
        }

        const { data: existingTickets, error: lookupError } = await supabaseAdmin
            .from('event-tickets')
            .select('*')
            .eq('event_id', eventId)
            .eq('user_id', userId);

        const { data: eventData } = await supabaseAdmin
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (lookupError) throw lookupError;

        if (existingTickets && existingTickets.length > 0) {
            return NextResponse.json(
                { error: 'Ticket already exists for this user and event' },
                { status: 409 }
            );
        }

        const { data: newTicket, error: insertError } = await supabaseAdmin
            .from('event-tickets')
            .insert({
                event_id: eventId,
                user_id: userId,
                ticket_price: session.amount_total ? (session.amount_total / 100).toString() : '0',
                user_email: session.customer_details?.email || session.metadata.user_email,
                event_title: eventData?.event_title,
                event_starts_at: eventData?.starts_at,
                event_address: eventData?.event_address,
                user_fullname: session.customer_details?.name,
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return NextResponse.json({
            success: true,
            eventId,
            userId,
            ticket: newTicket,
            paymentIntent: session.payment_intent,
        });
    } catch (error: any) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            {
                error: error.message || 'Payment verification failed',
                details: error.details || 'Unknown error'
            },
            { status: 500 }
        );
    }
}