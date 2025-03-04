import { Database } from '@/types/supabase';
import { Resend } from 'resend';
import { AttendingEventTemplate } from '@/email-templates/AttendingEventTemplate';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient<Database>()

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    const now = new Date();
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('*')
      .gte('starts_at', now.toISOString())
      .lte('starts_at', oneDayLater.toISOString());

    if (eventError) throw eventError;

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ message: 'No upcoming events found' }), { status: 200 });
    }

    for (const event of events) {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('group_name')
        .eq('id', event.event_group || "")
        .single();

      if (groupError) throw groupError;

      const groupName = group?.group_name || 'Your Group';

      const { data: attendees, error: attendeeError } = await supabase
        .from('event-attendees')
        .select('users (id, full_name, email)')
        .eq('event_id', event.id);

      if (attendeeError) throw attendeeError;

      if (!attendees || attendees.length === 0) continue;

      for (const attendee of attendees) {
        if (attendee.users) {
          const { email, full_name } = attendee.users;

          await resend.emails.send({
            from: 'huddle@huddle.net.pl',
            to: email || '',
            subject: `Reminder: ${event.event_title} is coming up!`,
            react: AttendingEventTemplate({
              fullName: full_name || '',
              group_name: groupName,
              date: event.starts_at || '',
              eventTitle: event.event_title || '',
              eventAddress: event.event_address || '',
            }) as React.ReactElement,
          });
        }
      }
    }

    return new Response(JSON.stringify({ message: 'Reminder emails sent successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error sending reminder emails:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}